--
-- PostgreSQL database dump
--

\restrict 4icZADvxZ1C2X6uDyGh8Xpca0wlnGcNuYrSH6PGEP0Yyh46YDqMNbYX6dUa1ET5

-- Dumped from database version 17.9
-- Dumped by pg_dump version 17.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: address; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.address VALUES (1, 'a', 'a', 'a', 'a', '1', 'USA');
INSERT INTO public.address VALUES (2, 'Default ATM', NULL, 'San Jose', 'CA', '95112', 'USA');
INSERT INTO public.address VALUES (3, 't', 't', 't', 't', '1', 'USA');


--
-- Data for Name: customer; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.customer VALUES (1, 'INDIVIDUAL', 'a', 'a', '1001-10-01', 'a@a.com', '2342347239', 1, '243798573', 'PENDING');
INSERT INTO public.customer VALUES (2, 'INDIVIDUAL', 'tan', 'N', '2005-02-03', 'tan@sjsu.edu', '2389423947', 3, '237982374', 'PENDING');


--
-- Data for Name: account; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.account VALUES (2, 1, '1720493691', '021000021', 'SAVINGS', 'ACTIVE', 100522.93, 'USD', '2026-04-25 19:32:22.450722');
INSERT INTO public.account VALUES (4, 2, '4704985375', '021000021', 'CHECKING', 'ACTIVE', 1510.00, 'USD', '2026-04-25 19:39:00.17374');
INSERT INTO public.account VALUES (5, 2, '3496628875', '021000021', 'SAVINGS', 'ACTIVE', 95324.83, 'USD', '2026-04-25 19:39:01.656732');
INSERT INTO public.account VALUES (3, 1, '4751682843', '021000021', 'SAVINGS', 'ACTIVE', 10045.88, 'USD', '2026-04-25 19:32:24.73796');
INSERT INTO public.account VALUES (1, 1, '4581810511', '021000021', 'CHECKING', 'ACTIVE', 11320.81, 'USD', '2026-04-25 19:32:21.125247');


--
-- Data for Name: atm; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.atm VALUES (1, 2, 'ACTIVE');


--
-- Data for Name: transaction; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.transaction VALUES (1, 'ATM_DEPOSIT', 1.00, 'USD', 'COMPLETED', '', '2026-04-25 19:32:28.624622');
INSERT INTO public.transaction VALUES (2, 'ATM_DEPOSIT', 2.00, 'USD', 'COMPLETED', '', '2026-04-25 19:32:28.868498');
INSERT INTO public.transaction VALUES (3, 'ATM_DEPOSIT', 3.00, 'USD', 'COMPLETED', '', '2026-04-25 19:32:29.204297');
INSERT INTO public.transaction VALUES (4, 'ATM_DEPOSIT', 4.00, 'USD', 'COMPLETED', '', '2026-04-25 19:32:29.476416');
INSERT INTO public.transaction VALUES (5, 'ATM_DEPOSIT', 5.00, 'USD', 'COMPLETED', '', '2026-04-25 19:32:29.768679');
INSERT INTO public.transaction VALUES (6, 'ATM_DEPOSIT', 6.00, 'USD', 'COMPLETED', '', '2026-04-25 19:32:30.039356');
INSERT INTO public.transaction VALUES (7, 'ATM_DEPOSIT', 7.00, 'USD', 'COMPLETED', '', '2026-04-25 19:32:30.3173');
INSERT INTO public.transaction VALUES (8, 'ATM_DEPOSIT', 8.00, 'USD', 'COMPLETED', '', '2026-04-25 19:32:30.601929');
INSERT INTO public.transaction VALUES (9, 'ATM_DEPOSIT', 9.00, 'USD', 'COMPLETED', '', '2026-04-25 19:32:30.91425');
INSERT INTO public.transaction VALUES (10, 'ATM_DEPOSIT', 10.00, 'USD', 'COMPLETED', '', '2026-04-25 19:32:31.325612');
INSERT INTO public.transaction VALUES (11, 'ATM_DEPOSIT', 11.00, 'USD', 'COMPLETED', '', '2026-04-25 19:32:31.729371');
INSERT INTO public.transaction VALUES (12, 'ATM_DEPOSIT', 12.00, 'USD', 'COMPLETED', '', '2026-04-25 19:32:32.057192');
INSERT INTO public.transaction VALUES (13, 'ATM_DEPOSIT', 13.00, 'USD', 'COMPLETED', '', '2026-04-25 19:32:32.438461');
INSERT INTO public.transaction VALUES (14, 'ATM_DEPOSIT', 14.00, 'USD', 'COMPLETED', '', '2026-04-25 19:32:32.75728');
INSERT INTO public.transaction VALUES (15, 'ATM_DEPOSIT', 15.00, 'USD', 'COMPLETED', '', '2026-04-25 19:32:33.050417');
INSERT INTO public.transaction VALUES (16, 'ATM_DEPOSIT', 16.00, 'USD', 'COMPLETED', '', '2026-04-25 19:32:33.347531');
INSERT INTO public.transaction VALUES (17, 'ATM_DEPOSIT', 17.00, 'USD', 'COMPLETED', '', '2026-04-25 19:32:33.690958');
INSERT INTO public.transaction VALUES (18, 'ATM_DEPOSIT', 18.00, 'USD', 'COMPLETED', '', '2026-04-25 19:32:34.103923');
INSERT INTO public.transaction VALUES (19, 'ATM_DEPOSIT', 19.00, 'USD', 'COMPLETED', '', '2026-04-25 19:32:34.532919');
INSERT INTO public.transaction VALUES (20, 'ATM_DEPOSIT', 20.00, 'USD', 'COMPLETED', '', '2026-04-25 19:32:35.029891');
INSERT INTO public.transaction VALUES (21, 'ATM_DEPOSIT', 21.00, 'USD', 'COMPLETED', '', '2026-04-25 19:32:35.825458');
INSERT INTO public.transaction VALUES (22, 'ATM_DEPOSIT', 212.00, 'USD', 'COMPLETED', '', '2026-04-25 19:32:36.546513');
INSERT INTO public.transaction VALUES (23, 'ATM_DEPOSIT', 23.00, 'USD', 'COMPLETED', '', '2026-04-25 19:32:37.065475');
INSERT INTO public.transaction VALUES (24, 'ATM_DEPOSIT', 24.00, 'USD', 'COMPLETED', '', '2026-04-25 19:32:37.409012');
INSERT INTO public.transaction VALUES (25, 'ATM_DEPOSIT', 25.00, 'USD', 'COMPLETED', '', '2026-04-25 19:32:37.741078');
INSERT INTO public.transaction VALUES (26, 'ATM_DEPOSIT', 26.00, 'USD', 'COMPLETED', '', '2026-04-25 19:32:38.052009');
INSERT INTO public.transaction VALUES (27, 'ATM_DEPOSIT', 27.00, 'USD', 'COMPLETED', '', '2026-04-25 19:32:38.441931');
INSERT INTO public.transaction VALUES (28, 'ATM_DEPOSIT', 28.00, 'USD', 'COMPLETED', '', '2026-04-25 19:32:38.934947');
INSERT INTO public.transaction VALUES (29, 'ATM_DEPOSIT', 29.00, 'USD', 'COMPLETED', '', '2026-04-25 19:32:39.308781');
INSERT INTO public.transaction VALUES (30, 'ATM_DEPOSIT', 3.00, 'USD', 'COMPLETED', '', '2026-04-25 19:32:39.786482');
INSERT INTO public.transaction VALUES (31, 'ATM_DEPOSIT', 30.00, 'USD', 'COMPLETED', '', '2026-04-25 19:32:40.99169');
INSERT INTO public.transaction VALUES (32, 'ATM_DEPOSIT', 31.00, 'USD', 'COMPLETED', '', '2026-04-25 19:32:41.58833');
INSERT INTO public.transaction VALUES (33, 'ATM_DEPOSIT', 32.00, 'USD', 'COMPLETED', '', '2026-04-25 19:32:42.180831');
INSERT INTO public.transaction VALUES (34, 'ATM_DEPOSIT', 33.00, 'USD', 'COMPLETED', '', '2026-04-25 19:32:43.708785');
INSERT INTO public.transaction VALUES (35, 'ATM_DEPOSIT', 334.00, 'USD', 'COMPLETED', '', '2026-04-25 19:32:44.260232');
INSERT INTO public.transaction VALUES (36, 'ATM_DEPOSIT', 1053.00, 'USD', 'COMPLETED', '', '2026-04-25 19:32:46.370598');
INSERT INTO public.transaction VALUES (37, 'ATM_DEPOSIT', 204.00, 'USD', 'COMPLETED', '', '2026-04-25 19:32:47.687182');
INSERT INTO public.transaction VALUES (38, 'ATM_DEPOSIT', 10342.69, 'USD', 'COMPLETED', '', '2026-04-25 19:32:55.437358');
INSERT INTO public.transaction VALUES (39, 'ATM_DEPOSIT', 100000.38, 'USD', 'COMPLETED', '', '2026-04-25 19:33:01.218174');
INSERT INTO public.transaction VALUES (40, 'WITHDRAWAL', 0.11, 'USD', 'COMPLETED', '', '2026-04-25 19:33:04.977628');
INSERT INTO public.transaction VALUES (41, 'WITHDRAWAL', 0.22, 'USD', 'COMPLETED', '', '2026-04-25 19:33:05.590581');
INSERT INTO public.transaction VALUES (42, 'WITHDRAWAL', 0.33, 'USD', 'COMPLETED', '', '2026-04-25 19:33:06.403467');
INSERT INTO public.transaction VALUES (43, 'WITHDRAWAL', 0.51, 'USD', 'COMPLETED', '', '2026-04-25 19:33:07.359337');
INSERT INTO public.transaction VALUES (44, 'WITHDRAWAL', 0.82, 'USD', 'COMPLETED', '', '2026-04-25 19:33:08.611459');
INSERT INTO public.transaction VALUES (45, 'WITHDRAWAL', 0.99, 'USD', 'COMPLETED', '', '2026-04-25 19:33:09.799073');
INSERT INTO public.transaction VALUES (46, 'WITHDRAWAL', 1000.00, 'USD', 'COMPLETED', '', '2026-04-25 19:33:13.67085');
INSERT INTO public.transaction VALUES (47, 'TRANSFER', 2.22, 'USD', 'COMPLETED', 'Transfer', '2026-04-25 19:33:50.814277');
INSERT INTO public.transaction VALUES (48, 'TRANSFER', 3.33, 'USD', 'COMPLETED', 'Transfer', '2026-04-25 19:33:58.968846');
INSERT INTO public.transaction VALUES (49, 'TRANSFER', 4.44, 'USD', 'COMPLETED', 'Transfer', '2026-04-25 19:34:05.588305');
INSERT INTO public.transaction VALUES (50, 'TRANSFER', 5.55, 'USD', 'COMPLETED', 'Transfer', '2026-04-25 19:34:12.149784');
INSERT INTO public.transaction VALUES (51, 'TRANSFER', 6.66, 'USD', 'COMPLETED', 'Transfer', '2026-04-25 19:34:20.297829');
INSERT INTO public.transaction VALUES (52, 'ATM_DEPOSIT', 10000.99, 'USD', 'COMPLETED', '', '2026-04-25 19:34:40.513271');
INSERT INTO public.transaction VALUES (53, 'TRANSFER', 500.35, 'USD', 'COMPLETED', 'Recurring Payment', '2026-04-25 19:35:12.078494');
INSERT INTO public.transaction VALUES (54, 'TRANSFER', 199.99, 'USD', 'COMPLETED', 'External transfer', '2026-04-25 19:37:29.313481');
INSERT INTO public.transaction VALUES (55, 'ATM_DEPOSIT', 400.00, 'USD', 'COMPLETED', '', '2026-04-25 19:39:08.067');
INSERT INTO public.transaction VALUES (56, 'ATM_DEPOSIT', 95328.38, 'USD', 'COMPLETED', '', '2026-04-25 19:39:18.930086');
INSERT INTO public.transaction VALUES (57, 'ATM_DEPOSIT', 100.00, 'USD', 'COMPLETED', '', '2026-04-25 19:39:22.216245');
INSERT INTO public.transaction VALUES (58, 'ATM_DEPOSIT', 200.00, 'USD', 'COMPLETED', '', '2026-04-25 19:39:23.16088');
INSERT INTO public.transaction VALUES (59, 'ATM_DEPOSIT', 300.00, 'USD', 'COMPLETED', '', '2026-04-25 19:39:23.733275');
INSERT INTO public.transaction VALUES (60, 'ATM_DEPOSIT', 400.00, 'USD', 'COMPLETED', '', '2026-04-25 19:39:24.352715');
INSERT INTO public.transaction VALUES (61, 'ATM_DEPOSIT', 10.00, 'USD', 'COMPLETED', '', '2026-04-25 19:39:25.147061');
INSERT INTO public.transaction VALUES (62, 'ATM_DEPOSIT', 20.00, 'USD', 'COMPLETED', '', '2026-04-25 19:39:25.59727');
INSERT INTO public.transaction VALUES (63, 'ATM_DEPOSIT', 30.00, 'USD', 'COMPLETED', '', '2026-04-25 19:39:26.083014');
INSERT INTO public.transaction VALUES (64, 'ATM_DEPOSIT', 40.00, 'USD', 'COMPLETED', '', '2026-04-25 19:39:26.730431');
INSERT INTO public.transaction VALUES (65, 'ATM_DEPOSIT', 1.00, 'USD', 'COMPLETED', '', '2026-04-25 19:39:27.22968');
INSERT INTO public.transaction VALUES (66, 'ATM_DEPOSIT', 2.00, 'USD', 'COMPLETED', '', '2026-04-25 19:39:27.627476');
INSERT INTO public.transaction VALUES (67, 'ATM_DEPOSIT', 3.00, 'USD', 'COMPLETED', '', '2026-04-25 19:39:27.965628');
INSERT INTO public.transaction VALUES (68, 'ATM_DEPOSIT', 4.00, 'USD', 'COMPLETED', '', '2026-04-25 19:39:28.387669');
INSERT INTO public.transaction VALUES (69, 'TRANSFER', 3.55, 'USD', 'COMPLETED', 'Recurring Payment', '2026-04-25 19:40:02.076002');


--
-- Data for Name: atmdeposit; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.atmdeposit VALUES (1, 1, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (2, 2, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (3, 3, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (4, 4, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (5, 5, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (6, 6, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (7, 7, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (8, 8, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (9, 9, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (10, 10, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (11, 11, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (12, 12, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (13, 13, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (14, 14, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (15, 15, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (16, 16, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (17, 17, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (18, 18, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (19, 19, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (20, 20, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (21, 21, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (22, 22, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (23, 23, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (24, 24, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (25, 25, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (26, 26, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (27, 27, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (28, 28, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (29, 29, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (30, 30, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (31, 31, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (32, 32, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (33, 33, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (34, 34, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (35, 35, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (36, 36, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (37, 37, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (38, 38, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (39, 39, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (40, 52, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (41, 55, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (42, 56, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (43, 57, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (44, 58, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (45, 59, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (46, 60, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (47, 61, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (48, 62, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (49, 63, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (50, 64, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (51, 65, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (52, 66, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (53, 67, 1, 'CASH');
INSERT INTO public.atmdeposit VALUES (54, 68, 1, 'CASH');


--
-- Data for Name: user; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."user" VALUES (8, 1, 'a', '\x2432622431322458573835762e2e51465848724d2f5361774c71734865392e46324d4c354147732e354e79654e6c525271444e4f7a7030386679464b', 'USER', '2026-04-25 19:32:18.98506', 'ACTIVE', '2026-04-25 19:32:18.985074');
INSERT INTO public."user" VALUES (9, 2, 'tan', '\x24326224313224522f36474b6c683048366c7767534951456c5a574e2e6f4162754e504356466f424735545a4e61386872564d4452422e4e6e524657', 'USER', '2026-04-25 19:38:57.690363', 'ACTIVE', '2026-04-25 19:38:57.690376');
INSERT INTO public."user" VALUES (1, NULL, 'admin', '\x243262243132246a37507737327551392f6767316c7044433054343075793979784e33564a5743347a4e356d526769577561452f4b306b593350444f', 'ADMIN', '2026-04-25 19:40:11.256015', 'ACTIVE', '2026-04-25 19:31:42.839083');


--
-- Data for Name: auditlog; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: ledgerentry; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.ledgerentry VALUES (1, 1, 1, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (2, 2, 1, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (3, 3, 1, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (4, 4, 1, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (5, 5, 1, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (6, 6, 1, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (7, 7, 1, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (8, 8, 1, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (9, 9, 1, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (10, 10, 1, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (11, 11, 1, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (12, 12, 1, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (13, 13, 1, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (14, 14, 1, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (15, 15, 1, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (16, 16, 1, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (17, 17, 1, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (18, 18, 1, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (19, 19, 1, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (20, 20, 1, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (21, 21, 1, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (22, 22, 1, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (23, 23, 1, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (24, 24, 1, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (25, 25, 1, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (26, 26, 1, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (27, 27, 1, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (28, 28, 1, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (29, 29, 1, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (30, 30, 1, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (31, 31, 1, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (32, 32, 1, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (33, 33, 1, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (34, 34, 1, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (35, 35, 1, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (36, 36, 1, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (37, 37, 1, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (38, 38, 3, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (39, 39, 2, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (40, 40, 1, 'DEBIT');
INSERT INTO public.ledgerentry VALUES (41, 41, 1, 'DEBIT');
INSERT INTO public.ledgerentry VALUES (42, 42, 1, 'DEBIT');
INSERT INTO public.ledgerentry VALUES (43, 43, 1, 'DEBIT');
INSERT INTO public.ledgerentry VALUES (44, 44, 1, 'DEBIT');
INSERT INTO public.ledgerentry VALUES (45, 45, 1, 'DEBIT');
INSERT INTO public.ledgerentry VALUES (46, 46, 1, 'DEBIT');
INSERT INTO public.ledgerentry VALUES (47, 47, 1, 'DEBIT');
INSERT INTO public.ledgerentry VALUES (48, 47, 2, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (49, 48, 1, 'DEBIT');
INSERT INTO public.ledgerentry VALUES (50, 48, 2, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (51, 49, 1, 'DEBIT');
INSERT INTO public.ledgerentry VALUES (52, 49, 2, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (53, 50, 1, 'DEBIT');
INSERT INTO public.ledgerentry VALUES (54, 50, 2, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (55, 51, 1, 'DEBIT');
INSERT INTO public.ledgerentry VALUES (56, 51, 2, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (57, 52, 1, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (58, 53, 3, 'DEBIT');
INSERT INTO public.ledgerentry VALUES (59, 53, 2, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (60, 54, 3, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (61, 55, 4, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (62, 56, 5, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (63, 57, 4, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (64, 58, 4, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (65, 59, 4, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (66, 60, 4, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (67, 61, 4, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (68, 62, 4, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (69, 63, 4, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (70, 64, 4, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (71, 65, 4, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (72, 66, 4, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (73, 67, 4, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (74, 68, 4, 'CREDIT');
INSERT INTO public.ledgerentry VALUES (75, 69, 5, 'DEBIT');
INSERT INTO public.ledgerentry VALUES (76, 69, 3, 'CREDIT');


--
-- Data for Name: onlinedeposit; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: potentialexternaltransfer; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.potentialexternaltransfer VALUES (2, '44677f99-3762-3e99-d538-39429205bf3a', 3, 199.98, 'USD', '2026-04-25 19:37:36.11231');


--
-- Data for Name: recurringpayment; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.recurringpayment VALUES (1, 3, '1720493691', '021000021', 500.35, 'USD', 'WEEKLY', '2026-05-02', '2026-04-25 19:35:05.381976', NULL, NULL);
INSERT INTO public.recurringpayment VALUES (2, 1, '1720493691', '021000021', 1000.00, 'USD', 'WEEKLY', '2027-10-01', '2026-04-25 19:35:34.979352', NULL, NULL);
INSERT INTO public.recurringpayment VALUES (3, 1, '4751682843', '021000021', 100.93, 'USD', 'ONCE', '2027-04-25', '2026-04-25 19:36:18.790823', NULL, NULL);
INSERT INTO public.recurringpayment VALUES (4, 5, '4751682843', '021000021', 3.55, 'USD', 'WEEKLY', '2026-05-02', '2026-04-25 19:39:58.835057', NULL, NULL);


--
-- Data for Name: transactiontoaccount; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.transactiontoaccount VALUES (1, 1);
INSERT INTO public.transactiontoaccount VALUES (2, 1);
INSERT INTO public.transactiontoaccount VALUES (3, 1);
INSERT INTO public.transactiontoaccount VALUES (4, 1);
INSERT INTO public.transactiontoaccount VALUES (5, 1);
INSERT INTO public.transactiontoaccount VALUES (6, 1);
INSERT INTO public.transactiontoaccount VALUES (7, 1);
INSERT INTO public.transactiontoaccount VALUES (8, 1);
INSERT INTO public.transactiontoaccount VALUES (9, 1);
INSERT INTO public.transactiontoaccount VALUES (10, 1);
INSERT INTO public.transactiontoaccount VALUES (11, 1);
INSERT INTO public.transactiontoaccount VALUES (12, 1);
INSERT INTO public.transactiontoaccount VALUES (13, 1);
INSERT INTO public.transactiontoaccount VALUES (14, 1);
INSERT INTO public.transactiontoaccount VALUES (15, 1);
INSERT INTO public.transactiontoaccount VALUES (16, 1);
INSERT INTO public.transactiontoaccount VALUES (17, 1);
INSERT INTO public.transactiontoaccount VALUES (18, 1);
INSERT INTO public.transactiontoaccount VALUES (19, 1);
INSERT INTO public.transactiontoaccount VALUES (20, 1);
INSERT INTO public.transactiontoaccount VALUES (21, 1);
INSERT INTO public.transactiontoaccount VALUES (22, 1);
INSERT INTO public.transactiontoaccount VALUES (23, 1);
INSERT INTO public.transactiontoaccount VALUES (24, 1);
INSERT INTO public.transactiontoaccount VALUES (25, 1);
INSERT INTO public.transactiontoaccount VALUES (26, 1);
INSERT INTO public.transactiontoaccount VALUES (27, 1);
INSERT INTO public.transactiontoaccount VALUES (28, 1);
INSERT INTO public.transactiontoaccount VALUES (29, 1);
INSERT INTO public.transactiontoaccount VALUES (30, 1);
INSERT INTO public.transactiontoaccount VALUES (31, 1);
INSERT INTO public.transactiontoaccount VALUES (32, 1);
INSERT INTO public.transactiontoaccount VALUES (33, 1);
INSERT INTO public.transactiontoaccount VALUES (34, 1);
INSERT INTO public.transactiontoaccount VALUES (35, 1);
INSERT INTO public.transactiontoaccount VALUES (36, 1);
INSERT INTO public.transactiontoaccount VALUES (37, 1);
INSERT INTO public.transactiontoaccount VALUES (38, 3);
INSERT INTO public.transactiontoaccount VALUES (39, 2);
INSERT INTO public.transactiontoaccount VALUES (40, 1);
INSERT INTO public.transactiontoaccount VALUES (41, 1);
INSERT INTO public.transactiontoaccount VALUES (42, 1);
INSERT INTO public.transactiontoaccount VALUES (43, 1);
INSERT INTO public.transactiontoaccount VALUES (44, 1);
INSERT INTO public.transactiontoaccount VALUES (45, 1);
INSERT INTO public.transactiontoaccount VALUES (46, 1);
INSERT INTO public.transactiontoaccount VALUES (47, 1);
INSERT INTO public.transactiontoaccount VALUES (47, 2);
INSERT INTO public.transactiontoaccount VALUES (48, 1);
INSERT INTO public.transactiontoaccount VALUES (48, 2);
INSERT INTO public.transactiontoaccount VALUES (49, 1);
INSERT INTO public.transactiontoaccount VALUES (49, 2);
INSERT INTO public.transactiontoaccount VALUES (50, 1);
INSERT INTO public.transactiontoaccount VALUES (50, 2);
INSERT INTO public.transactiontoaccount VALUES (51, 1);
INSERT INTO public.transactiontoaccount VALUES (51, 2);
INSERT INTO public.transactiontoaccount VALUES (52, 1);
INSERT INTO public.transactiontoaccount VALUES (53, 3);
INSERT INTO public.transactiontoaccount VALUES (53, 2);
INSERT INTO public.transactiontoaccount VALUES (54, 3);
INSERT INTO public.transactiontoaccount VALUES (55, 4);
INSERT INTO public.transactiontoaccount VALUES (56, 5);
INSERT INTO public.transactiontoaccount VALUES (57, 4);
INSERT INTO public.transactiontoaccount VALUES (58, 4);
INSERT INTO public.transactiontoaccount VALUES (59, 4);
INSERT INTO public.transactiontoaccount VALUES (60, 4);
INSERT INTO public.transactiontoaccount VALUES (61, 4);
INSERT INTO public.transactiontoaccount VALUES (62, 4);
INSERT INTO public.transactiontoaccount VALUES (63, 4);
INSERT INTO public.transactiontoaccount VALUES (64, 4);
INSERT INTO public.transactiontoaccount VALUES (65, 4);
INSERT INTO public.transactiontoaccount VALUES (66, 4);
INSERT INTO public.transactiontoaccount VALUES (67, 4);
INSERT INTO public.transactiontoaccount VALUES (68, 4);
INSERT INTO public.transactiontoaccount VALUES (69, 5);
INSERT INTO public.transactiontoaccount VALUES (69, 3);


--
-- Data for Name: transfer; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.transfer VALUES (1, 47, NULL, '021000021', '4581810511', '021000021', '1720493691');
INSERT INTO public.transfer VALUES (2, 48, NULL, '021000021', '4581810511', '021000021', '1720493691');
INSERT INTO public.transfer VALUES (3, 49, NULL, '021000021', '4581810511', '021000021', '1720493691');
INSERT INTO public.transfer VALUES (4, 50, NULL, '021000021', '4581810511', '021000021', '1720493691');
INSERT INTO public.transfer VALUES (5, 51, NULL, '021000021', '4581810511', '021000021', '1720493691');
INSERT INTO public.transfer VALUES (6, 53, 1, '021000021', '4751682843', '021000021', '1720493691');
INSERT INTO public.transfer VALUES (7, 54, NULL, '011401533', '1111222233331111', '021000021', '4751682843');
INSERT INTO public.transfer VALUES (8, 69, 4, '021000021', '3496628875', '021000021', '4751682843');


--
-- Data for Name: withdraw; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.withdraw VALUES (1, 40, 1);
INSERT INTO public.withdraw VALUES (2, 41, 1);
INSERT INTO public.withdraw VALUES (3, 42, 1);
INSERT INTO public.withdraw VALUES (4, 43, 1);
INSERT INTO public.withdraw VALUES (5, 44, 1);
INSERT INTO public.withdraw VALUES (6, 45, 1);
INSERT INTO public.withdraw VALUES (7, 46, 1);


--
-- Name: account_account_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.account_account_id_seq', 5, true);


--
-- Name: address_address_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.address_address_id_seq', 3, true);


--
-- Name: atm_atm_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.atm_atm_id_seq', 1, true);


--
-- Name: atmdeposit_deposit_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.atmdeposit_deposit_id_seq', 54, true);


--
-- Name: auditlog_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auditlog_log_id_seq', 1, false);


--
-- Name: customer_customer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customer_customer_id_seq', 2, true);


--
-- Name: ledgerentry_ledger_entry_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ledgerentry_ledger_entry_id_seq', 76, true);


--
-- Name: onlinedeposit_deposit_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.onlinedeposit_deposit_id_seq', 1, false);


--
-- Name: potentialexternaltransfer_potential_external_transfer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.potentialexternaltransfer_potential_external_transfer_id_seq', 2, true);


--
-- Name: recurringpayment_recurring_payment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.recurringpayment_recurring_payment_id_seq', 4, true);


--
-- Name: transaction_transaction_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.transaction_transaction_id_seq', 69, true);


--
-- Name: transfer_transfer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.transfer_transfer_id_seq', 8, true);


--
-- Name: user_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_user_id_seq', 9, true);


--
-- Name: withdraw_withdraw_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.withdraw_withdraw_id_seq', 7, true);


--
-- PostgreSQL database dump complete
--

\unrestrict 4icZADvxZ1C2X6uDyGh8Xpca0wlnGcNuYrSH6PGEP0Yyh46YDqMNbYX6dUa1ET5

