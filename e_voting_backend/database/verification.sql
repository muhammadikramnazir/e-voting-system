-- Standalone lawyer verification table schema.
-- Select the target database before running this file.

CREATE TABLE IF NOT EXISTS lawyer_verifications (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone_number VARCHAR(30) NOT NULL,
    cnic_number VARCHAR(30) NOT NULL,

    bar_registration_no VARCHAR(100) NOT NULL,
    license_number VARCHAR(100) NOT NULL,
    bar_association VARCHAR(150) NOT NULL,
    practice_area VARCHAR(150) NULL,
    years_of_practice INT NULL,
    chamber_address TEXT NULL,

    cnic_front VARCHAR(255) NOT NULL,
    cnic_back VARCHAR(255) NOT NULL,
    lawyer_license VARCHAR(255) NOT NULL,
    bar_card VARCHAR(255) NOT NULL,
    additional_document VARCHAR(255) NULL,

    status ENUM(
        'Pending',
        'Approved',
        'Rejected'
    ) NOT NULL DEFAULT 'Pending',

    admin_remarks TEXT NULL,

    submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    deleted_at DATETIME NULL,

    CONSTRAINT fk_lawyer_verifications_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    INDEX idx_verification_user (user_id),
    INDEX idx_verification_status (status),
    INDEX idx_verification_deleted (deleted_at)
);
