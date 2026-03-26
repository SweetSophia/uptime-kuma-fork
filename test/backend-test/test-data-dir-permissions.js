const { describe, test, afterEach } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { sync: rimrafSync } = require("rimraf");
const Database = require("../../server/database");

let createdDirs = [];

describe("Database.initDataDir", () => {
    afterEach(() => {
        for (const dir of createdDirs) {
            rimrafSync(dir);
        }

        createdDirs = [];
        delete process.env.DATA_DIR;
    });

    test("creates app data directories with private permissions on POSIX systems", () => {
        const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "uptime-kuma-data-dir-"));
        rimrafSync(dataDir);
        createdDirs.push(dataDir);

        Database.initDataDir({ "data-dir": dataDir });

        const dirs = [
            Database.dataDir,
            Database.uploadDir,
            Database.screenshotDir,
            Database.dockerTLSDir,
        ];

        for (const dir of dirs) {
            assert.ok(fs.existsSync(dir), `${dir} should exist`);

            if (process.platform !== "win32") {
                const mode = fs.statSync(dir).mode & 0o777;
                assert.strictEqual(mode, 0o700, `${dir} should be private`);
            }
        }
    });

    test("tightens existing app data directories to private permissions on POSIX systems", () => {
        const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "uptime-kuma-existing-data-dir-"));
        createdDirs.push(dataDir);

        fs.chmodSync(dataDir, 0o755);
        fs.mkdirSync(path.join(dataDir, "upload"), { recursive: true, mode: 0o755 });
        fs.mkdirSync(path.join(dataDir, "screenshots"), { recursive: true, mode: 0o755 });
        fs.mkdirSync(path.join(dataDir, "docker-tls"), { recursive: true, mode: 0o755 });

        Database.initDataDir({ "data-dir": dataDir });

        if (process.platform !== "win32") {
            const dirs = [
                Database.dataDir,
                Database.uploadDir,
                Database.screenshotDir,
                Database.dockerTLSDir,
            ];

            for (const dir of dirs) {
                const mode = fs.statSync(dir).mode & 0o777;
                assert.strictEqual(mode, 0o700, `${dir} should be private`);
            }
        }
    });
});
