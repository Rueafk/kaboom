PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE players (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            wallet_address TEXT UNIQUE NOT NULL,
            username TEXT,
            level INTEGER DEFAULT 1,
            total_score INTEGER DEFAULT 0,
            boom_tokens INTEGER DEFAULT 0,
            lives INTEGER DEFAULT 3,
            current_score INTEGER DEFAULT 0,
            last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
INSERT INTO players VALUES(66,'5u4iU6mN2fWKbD8pCNizvtdFYSSxubcgKZh5Szf5ziKv','Kaboom_5u4iU6',1,55900,5590,3,0,'2025-08-24 16:28:23','2025-08-24 16:28:23');
INSERT INTO players VALUES(74,'7hFiL6Y38Tki9nynsLZSzqMMABJ9phKxZBXYeshZiz8h','Kaboom_7hFiL6',1,2700,270,3,0,'2025-08-25 04:32:51','2025-08-25 04:32:51');
INSERT INTO players VALUES(76,'6vQ3yxe3a6aTdKce89wLZBgKgLAtahw5VWdQRG8bDvqg','Kaboom_6vQ3yx',1,0,0,3,0,'2025-08-25 04:35:35','2025-08-25 04:35:35');
INSERT INTO players VALUES(132,'6M7kt5t235PneqWNFfpS2CA2UAy7KUndZ5dn2MwUJwdS','Kaboom_6M7kt5',4,5400,540,1,5400,'2025-08-25 15:56:24','2025-08-25 15:56:24');
COMMIT;
