-- DANS LA CONSOLE DE LA DB postgresql
CREATE USER custom_user WITH PASSWORD 'custom_pass';
CREATE DATABASE custom_db OWNER custom_user;
-- DANS LA CONSOLE DE CETTE DB
CREATE SCHEMA TFE
-- REMPLIR LA DB ^^

CREATE TABLE TFE.years_sections (
    id_year_section SERIAL NOT NULL,
    year CHAR(2) NOT NULL,
    section CHAR(3) NOT NULL,
    PRIMARY KEY(id_year_section)
);

CREATE TABLE TFE.profiles (
    id_profile SERIAL NOT NULL,
    id_year INTEGER NOT NULL REFERENCES TFE.years_sections(id_year_section),
    name VARCHAR(15) NOT NULL,
    PRIMARY KEY(id_profile)
);

CREATE TABLE TFE.softwares (
    id_software SERIAL NOT NULL,
    name VARCHAR(50) NOT NULL,
    PRIMARY KEY(id_software)
);

CREATE TABLE TFE.profiles_softwares (
    id_profile_software SERIAL NOT NULL,
    id_profile INTEGER NOT NULL REFERENCES TFE.profiles(id_profile),
    id_software INTEGER NOT NULL REFERENCES TFE.softwares(id_software),
    UNIQUE(id_profile, id_software),
    PRIMARY KEY(id_profile_software)
);

CREATE TABLE TFE.users (
    id_user SERIAL NOT NULL,
    id_year INTEGER NULL REFERENCES TFE.years_sections(id_year_section),
    id_profile INTEGER NULL REFERENCES TFE.profiles(id_profile),
    matricule CHAR(5) UNIQUE NULL,
    name VARCHAR(50) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    login CHAR(7) NULL,
    email VARCHAR(100) NULL,
    user_type VARCHAR(10) NOT NULL,
    admin_password VARCHAR(256) NULL,
    PRIMARY KEY(id_user)
);

CREATE TABLE TFE.users_access (
    id_user_access SERIAL NOT NULL,
    id_user INTEGER NOT NULL REFERENCES TFE.users(id_user),
    id_software INTEGER NOT NULL REFERENCES TFE.softwares(id_software),
    password VARCHAR(246) NOT NULL,
    PRIMARY KEY(id_user_access)
);

--------------------------------------------------------------------------------------------------------------------------------
-----------------------------------------------INSERTS--------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------------------------------------

TRUNCATE TFE.years_sections, TFE.profiles, TFE.softwares RESTART IDENTITY CASCADE;


--years
INSERT INTO TFE.years_sections VALUES (DEFAULT, '1B', 'BBM');
INSERT INTO TFE.years_sections VALUES (DEFAULT, '1B', 'BDI');
INSERT INTO TFE.years_sections VALUES (DEFAULT, '1B', 'BIN');
INSERT INTO TFE.years_sections VALUES (DEFAULT, '2B', 'BBM');
INSERT INTO TFE.years_sections VALUES (DEFAULT, '2B', 'BDI');
INSERT INTO TFE.years_sections VALUES (DEFAULT, '2B', 'BIN');
INSERT INTO TFE.years_sections VALUES (DEFAULT, '3B', 'BBM');
INSERT INTO TFE.years_sections VALUES (DEFAULT, '3B', 'BDI');
INSERT INTO TFE.years_sections VALUES (DEFAULT, '3B', 'BIN');

--profiles
INSERT INTO TFE.profiles VALUES (DEFAULT, 1, '1BBM');
INSERT INTO TFE.profiles VALUES (DEFAULT, 2, '1BDI');
INSERT INTO TFE.profiles VALUES (DEFAULT, 3, '1BIN');
INSERT INTO TFE.profiles VALUES (DEFAULT, 4, '2BBM');
INSERT INTO TFE.profiles VALUES (DEFAULT, 5, '2BDI');
INSERT INTO TFE.profiles VALUES (DEFAULT, 6, '2BIN');
INSERT INTO TFE.profiles VALUES (DEFAULT, 7, '3BBM');
INSERT INTO TFE.profiles VALUES (DEFAULT, 8, '3BDI');
INSERT INTO TFE.profiles VALUES (DEFAULT, 9, '3BIN');

--softwares
INSERT INTO TFE.softwares VALUES (DEFAULT, 'Windows');
INSERT INTO TFE.softwares VALUES (DEFAULT, 'Claroline');
INSERT INTO TFE.softwares VALUES (DEFAULT, 'Nutrilog');

--profile//access( 1BDI et 1BIN )
INSERT INTO TFE.profiles_softwares VALUES (DEFAULT, 3, 1);
INSERT INTO TFE.profiles_softwares VALUES (DEFAULT, 3, 2);
INSERT INTO TFE.profiles_softwares VALUES (DEFAULT, 2, 1);
INSERT INTO TFE.profiles_softwares VALUES (DEFAULT, 2, 2);
INSERT INTO TFE.profiles_softwares VALUES (DEFAULT, 2, 3);

--users c'est ADMIN
INSERT INTO TFE.users VALUES (DEFAULT, NULL, NULL, NULL, 'Admin', 'Ladministrateur', NULL, NULL, 'Admin', 'admin');

