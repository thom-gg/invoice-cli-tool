import fs from "fs";
import select, { Separator } from '@inquirer/select';
import input from '@inquirer/input';
import checkbox from '@inquirer/checkbox';
import { createSpinner } from 'nanospinner'

const CLIENTS_FOLDER = "./clients"

export async function loadClients() {
    try {
        let res = [];
        var files = fs.readdirSync(CLIENTS_FOLDER);
        for (let i = 0; i < files.length; i++) {
            let client_file = files[i];
            const data = fs.readFileSync(`${CLIENTS_FOLDER}/${client_file}`);
            res.push(JSON.parse(data));
        }
        return res;
    }
    catch (e) {
        console.log(e);
        return [];
    }
}



const addClient = async () => {
    const client_full_name = await input({ message: "Enter client's full name" });
    const client_address = await input({ message: 'Enter address first line' });
    const client_city = await input({ message: 'Enter address second line' });
    const client_country = await input({ message: 'Enter country / country code' });

    const spinner = createSpinner('Saving client...').start();

    let client = {
        client_full_name: client_full_name,
        client_address: client_address,
        client_city: client_city,
        client_country: client_country,

    }
    let file_name = `${client_full_name.replace(' ', '-')}.json`;

    let json = JSON.stringify(client);

    fs.writeFileSync(`${CLIENTS_FOLDER}/${file_name}`, json);
    spinner.success();
    console.log("\n");
}

const displayClientList = (client_list) => {
    console.log(`📝 Displaying clients informations`);
    for (let c of client_list) {
        console.log("");
        console.log(`\t📌 Full name:\t\t ${c.client_full_name}`);
        console.log(`\t📌 Address line 1:\t ${c.client_address}`);
        console.log(`\t📌 Address line 2:\t ${c.client_city}`);
        console.log(`\t📌 Country:\t\t ${c.client_country}`);

    }
    console.log("\n")
}

const removeClient = async (client_list) => {
    if (client_list.length == 0) {
        console.log(`❌  You don't have clients users to remove`);
        return;
    }
    let choices = [];
    for (let u of client_list) {
        choices.push({ name: u.client_full_name, value: `${u.client_full_name.replace(' ', '-')}.json` });
    }

    const answer = await checkbox({
        message: 'Select client(s) to remove',
        choices: choices
    });

    for (let a of answer) {
        fs.unlinkSync(`${CLIENTS_FOLDER}/${a}`)
        console.log(`🗑️  Deleted ${a} !\n\n`);
    }
}

export const clientManagement = async (argv) => {
    let registered_clients = await loadClients();
    console.log(`✨ You have ${registered_clients.length} clients !`);
    for (let u of registered_clients) {
        console.log(`\t🤵 ${u.client_full_name}`)
    }
    console.log("\n")
    const choice = await select({
        message: 'What do you want to do ?',
        choices: [
            {
                name: 'Add a client',
                value: 'add',
            },
            {
                name: 'Remove a client',
                value: 'remove',
            },
            {
                name: 'Display list with details',
                value: 'list',
            }

        ],
    });
    switch (choice) {
        case "add":
            await addClient();
            break;
        case "remove":
            await removeClient(registered_clients);
            break;
        case "list":
            displayClientList(registered_clients)
            break;
    }


}