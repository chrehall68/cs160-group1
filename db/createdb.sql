CREATE TABLE example_table (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    value INTEGER NOT NULL
);

INSERT INTO example_table (name, value) VALUES ('example1', 100);
INSERT INTO example_table (name, value) VALUES ('example2', 200);