

import fs from "fs";
import { userManagement } from "./user.js";
import { argv, exit } from "process";
import figlet from "figlet";
import { clientManagement } from "./clients.js";
import { invoiceManagement } from "./invoice.js";
import chalk from 'chalk';



// Check data folders exists, if not create them
let folders = ["./clients", "./templates", "./users", "./output"];
for (let f of folders) {
    if (!fs.existsSync(f)) {
        await fs.mkdirSync(f);
    }
}


console.log(figlet.textSync("INVOICE TOOL"));
switch (argv[2]) {
    case "user":
        await userManagement(argv);
        break;
    case "client":
        await clientManagement(argv);
        break;
    case "invoice":
        await invoiceManagement(argv);
        break;
    default:
        console.log("❗ Invalid arguments, usage:");
        console.log(`\t${chalk.blue("node index.js user")} for users management`);
        console.log(`\t${chalk.blue("node index.js client")} for clients management`);
        console.log(`\t${chalk.blue("node index.js invoice")} to create an invoice`);

        break;
}

process.exit(0);



