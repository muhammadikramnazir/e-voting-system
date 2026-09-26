import db from "../db/database.js";

// ==========================================
// GET ALL ELECTIONS
// ==========================================
export const getElections = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
          e.id,
          e.title,
          e.type,
          e.description,
          e.start_at,
          e.end_at,
          e.status,
          e.results_published,
          COUNT(DISTINCT c.id) AS candidate_count,
          COUNT(DISTINCT v.id) AS vote_count
       FROM elections e

       LEFT JOIN candidates c
         ON c.election_id = e.id
        AND c.deleted_at IS NULL

       LEFT JOIN votes v
         ON v.election_id = e.id
        AND v.status = 'Valid'

       WHERE e.deleted_at IS NULL

       GROUP BY e.id
       ORDER BY e.start_at DESC`
    );

    return res.json({
      status: true,
      elections: rows,
    });
  } catch (error) {
    console.error("GET ELECTIONS ERROR:", error);

    return res.status(500).json({
      status: false,
      message: "Failed to fetch elections.",
    });
  }
};

// ==========================================
// GET ELECTION BY ID
// ==========================================
export const getElectionById = async (req, res) => {
  try {
    const electionId = Number(req.params.id);

    if (!Number.isInteger(electionId) || electionId <= 0) {
      return res.status(400).json({
        status: false,
        message: "Invalid election ID.",
      });
    }

    const [elections] = await db.query(
      `SELECT
          id,
          title,
          type,
          description,
          start_at,
          end_at,
          status,
          results_published
       FROM elections
       WHERE id = ?
         AND deleted_at IS NULL
       LIMIT 1`,
      [electionId]
    );

    if (!elections.length) {
      return res.status(404).json({
        status: false,
        message: "Election not found.",
      });
    }

    // Only active positions are exposed to members.
    const [positions] = await db.query(
      `SELECT
          id,
          election_id,
          name,
          description,
          seats,
          status
       FROM positions
       WHERE election_id = ?
         AND status = 'Active'
         AND deleted_at IS NULL
       ORDER BY sort_order, id`,
      [electionId]
    );

    // Only approved candidates belonging to active positions
    // are exposed to members.
    const [candidates] = await db.query(
      `SELECT
          c.id,
          c.election_id,
          c.position_id,
          c.name,
          c.bar_number,
          c.photo,
          c.nomination,
          c.manifesto,
          c.status
       FROM candidates c
       INNER JOIN positions p
         ON p.id = c.position_id
        AND p.deleted_at IS NULL
        AND p.status = 'Active'
       WHERE c.election_id = ?
         AND c.deleted_at IS NULL
         AND c.status = 'Approved'
       ORDER BY c.id`,
      [electionId]
    );

    return res.json({
      status: true,
      election: elections[0],
      positions,
      candidates,
    });
  } catch (error) {
    console.error("GET ELECTION ERROR:", error);

    return res.status(500).json({
      status: false,
      message: "Failed to fetch election.",
    });
  }
};

// ==========================================
// GET ELECTION CANDIDATES
// ==========================================
export const getElectionCandidates = async (req, res) => {
  try {
    const electionId = Number(req.params.id);

    if (!Number.isInteger(electionId) || electionId <= 0) {
      return res.status(400).json({
        status: false,
        message: "Invalid election ID.",
      });
    }

    const [rows] = await db.query(
      `SELECT
          c.id,
          c.election_id,
          c.position_id,
          p.name AS position,
          c.name,
          c.bar_number,
          c.photo,
          c.nomination,
          c.manifesto,
          c.status
       FROM candidates c

       INNER JOIN positions p
         ON p.id = c.position_id
        AND p.deleted_at IS NULL
        AND p.status = 'Active'

       WHERE c.election_id = ?
         AND c.deleted_at IS NULL
         AND c.status = 'Approved'

       ORDER BY p.sort_order, c.id`,
      [electionId]
    );

    return res.json({
      status: true,
      candidates: rows,
    });
  } catch (error) {
    console.error("GET CANDIDATES ERROR:", error);

    return res.status(500).json({
      status: false,
      message: "Failed to fetch candidates.",
    });
  }
};

// ==========================================
// CAST VOTE
// ==========================================
// ==========================================
// CAST VOTE
// ==========================================
export const castVote = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const electionId = Number(req.body?.electionId);
    const positionId = Number(req.body?.positionId);
    const candidateId = Number(req.body?.candidateId);

    if (
      !electionId ||
      !positionId ||
      !candidateId
    ) {
      return res.status(400).json({
        status: false,
        message:
          "Election, position and candidate are required.",
      });
    }

    await connection.beginTransaction();


    // ==========================================
    // CHECK VOTER ACCOUNT
    // ==========================================

    const [voters] =
      await connection.query(
        `SELECT
            id,
            status
         FROM users
         WHERE id = ?
           AND deleted_at IS NULL
         LIMIT 1
         FOR UPDATE`,
        [req.user.id]
      );


    if (!voters.length) {
      await connection.rollback();

      return res.status(401).json({
        status: false,
        message:
          "Your account could not be verified.",
      });
    }


    const voterStatus =
      voters[0].status;


    // ==========================================
    // ONLY VERIFIED LAWYERS CAN VOTE
    // ==========================================

    if (voterStatus !== "Verified") {
      await connection.rollback();

      if (voterStatus === "Pending") {
        return res.status(403).json({
          status: false,
          message:
            "Your lawyer verification is still pending. You cannot vote until your account is verified.",
        });
      }


      if (voterStatus === "Suspended") {
        return res.status(403).json({
          status: false,
          message:
            "Your account is suspended. You are not allowed to vote.",
        });
      }


      return res.status(403).json({
        status: false,
        message:
          "Only verified lawyers are allowed to vote.",
      });
    }


    // ==========================================
    // CHECK ELECTION
    // ==========================================

    const [elections] =
      await connection.query(
        `SELECT
            id,
            status,
            start_at,
            end_at
         FROM elections
         WHERE id = ?
           AND status = 'Active'
           AND deleted_at IS NULL
           AND start_at <= NOW()
           AND end_at >= NOW()
         LIMIT 1
         FOR UPDATE`,
        [electionId]
      );


    if (!elections.length) {
      await connection.rollback();

      return res.status(400).json({
        status: false,
        message:
          "Voting is not currently open for this election.",
      });
    }


    // ==========================================
    // CHECK CANDIDATE + POSITION
    // ==========================================

    /*
     * Candidate must:
     *
     * 1. Exist
     * 2. Belong to this election
     * 3. Belong to this position
     * 4. Be Approved
     * 5. Belong to an Active position
     */

    const [candidate] =
      await connection.query(
        `SELECT
            c.id
         FROM candidates c

         INNER JOIN positions p
           ON p.id = c.position_id
          AND p.deleted_at IS NULL
          AND p.status = 'Active'

         WHERE c.id = ?
           AND c.election_id = ?
           AND c.position_id = ?
           AND c.status = 'Approved'
           AND c.deleted_at IS NULL

         LIMIT 1`,
        [
          candidateId,
          electionId,
          positionId,
        ]
      );


    if (!candidate.length) {
      await connection.rollback();

      return res.status(400).json({
        status: false,
        message:
          "Selected candidate is not valid for this position.",
      });
    }


    // ==========================================
    // CHECK DUPLICATE VOTE
    // ==========================================

    const [duplicate] =
      await connection.query(
        `SELECT
            id
         FROM votes
         WHERE voter_id = ?
           AND election_id = ?
           AND position_id = ?
           AND status = 'Valid'
         LIMIT 1`,
        [
          req.user.id,
          electionId,
          positionId,
        ]
      );


    if (duplicate.length) {
      await connection.rollback();

      return res.status(409).json({
        status: false,
        message:
          "You have already voted for this position.",
      });
    }


    // ==========================================
    // INSERT VOTE
    // ==========================================

    await connection.query(
      `INSERT INTO votes
        (
          voter_id,
          election_id,
          position_id,
          candidate_id,
          status
        )
       VALUES
        (
          ?,
          ?,
          ?,
          ?,
          'Valid'
        )`,
      [
        req.user.id,
        electionId,
        positionId,
        candidateId,
      ]
    );


    await connection.commit();


    return res.status(201).json({
      status: true,
      message:
        "Vote cast successfully.",
    });

  } catch (error) {

    await connection.rollback();


    // Database-level duplicate protection
    if (
      error?.code === "ER_DUP_ENTRY"
    ) {
      return res.status(409).json({
        status: false,
        message:
          "You have already voted for this position.",
      });
    }


    console.error(
      "CAST VOTE ERROR:",
      error
    );


    return res.status(500).json({
      status: false,
      message:
        "Failed to cast vote.",
    });

  } finally {

    connection.release();

  }
};

// ==========================================
// GET RESULTS
// ==========================================
export const getResults = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
          e.id AS election_id,
          e.title AS election_title,
          e.end_at,
          p.id AS position_id,
          p.name AS position,
          c.id AS candidate_id,
          c.name AS candidate_name,
          COUNT(v.id) AS total_votes

       FROM elections e

       INNER JOIN positions p
         ON p.election_id = e.id
        AND p.deleted_at IS NULL

       INNER JOIN candidates c
         ON c.position_id = p.id
        AND c.deleted_at IS NULL
        AND c.status = 'Approved'

       LEFT JOIN votes v
         ON v.candidate_id = c.id
        AND v.status = 'Valid'

       WHERE e.deleted_at IS NULL
         AND e.results_published = 1
         AND e.end_at < NOW()

       GROUP BY
          e.id,
          p.id,
          c.id

       ORDER BY
          e.end_at DESC,
          p.sort_order,
          total_votes DESC`
    );

    return res.json({
      status: true,
      results: rows,
    });
  } catch (error) {
    console.error("GET RESULTS ERROR:", error);

    return res.status(500).json({
      status: false,
      message: "Failed to fetch results.",
    });
  }
};