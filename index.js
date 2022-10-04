#!/usr/bin/env node

const sh = require("shelljs");
const yargs = require("yargs");

function setupArgv() {
	const { argv } = yargs
		.option("h", {
			type: "string",
			describe: "host",
			default: "localhost"
		})
		.option("d", {
			type: "string",
			describe: "database",
			default: "test"
		})
		.option("U", {
			type: "string",
			describe: "db user",
			default: "root"
		})
		.option("p", {
			type: "string",
			describe: "db password",
			default: "toor"
		})
		.option("port", {
			type: "number",
			describe: "port",
			default: 5434
		});

	return argv;
}

function main() {
	const SLOT = "test_slot";
	const {
		h: host,
		d: database,
		U: dbUserName,
		p: dbPassword,
		port: dbPort
	} = setupArgv();

	sh.set("-e");

	// create slot if not exists
	sh.exec(`PGPASSWORD=${dbPassword} pg_recvlogical -h ${host} \
            -U ${dbUserName} -d ${database} --port ${dbPort} \
            --slot=${SLOT} --create-slot --if-not-exists -P wal2json`);

	console.log(`SLOT ${SLOT} WAS CREATED`);

	// capture WAL via pg_recvlogical
	const captureWalCmd = `PGPASSWORD=${dbPassword} pg_recvlogical -h ${host} \
                            -U ${dbUserName} -d ${database} --port ${dbPort} \
                            --slot=${SLOT} --start -o pretty-print=1 \
                            -o format-version=2 \
                            -o add-msg-prefixes=wal2json -f -`;

	// handle WAL
	const handleWalCmd = "./handle-wal";

	// pipe WAL to handle WAL
	sh.exec(`${captureWalCmd} | ${handleWalCmd}`);

	console.log("DONE");
}

main();
