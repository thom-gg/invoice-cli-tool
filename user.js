import fs from "fs";
import select, { Separator } from '@inquirer/select';
import input from '@inquirer/input';
import checkbox from '@inquirer/checkbox';


const USER_FOLDER = "./users"

export async function loadUsers() {
    try {
        let res = [];
        var files = fs.readdirSync(USER_FOLDER);
        for (let i = 0; i < files.length; i++) {
            let user_file = files[i];
            const data = fs.readFileSync(`${USER_FOLDER}/${user_file}`);
            res.push(JSON.parse(data));
        }
        return res;
    }
    catch (e) {
        console.log(e);
        return [];
    }
}



const addUser = async () => {
    const user_full_name = await input({ message: 'Enter your full name' });
    const user_address = await input({ message: 'Enter your address first line' });
    const user_city = await input({ message: 'Enter your address second line' });
    const user_country = await input({ message: 'Enter your country / country code' });
    const user_siren = await input({ message: 'Enter your SIREN number' });
    const user_tva_number = await input({ message: 'Enter your tva number' });
    const user_iban = await input({ message: 'Enter your IBAN' });
    const user_bic = await input({ message: 'Enter your BIC' });

    let user = {
        user_full_name: user_full_name,
        user_address: user_address,
        user_city: user_city,
        user_country: user_country,
        user_siren: user_siren,
        user_tva_number: user_tva_number,
        user_iban: user_iban,
        user_bic: user_bic
    }

    let file_name = `${user_full_name.replace(' ', '-')}.json`;

    let json = JSON.stringify(user);

    fs.writeFileSync(`${USER_FOLDER}/${file_name}`, json);
    console.log(`Successfully added user ${file_name}`)
}

const displayUserList = (user_list) => {
    console.log(`📝 Displaying users informations`);
    for (let u of user_list) {
        console.log("");
        console.log(`\t📌 Full name:\t\t ${u.user_full_name}`);
        console.log(`\t📌 Address line 1:\t ${u.user_address}`);
        console.log(`\t📌 Address line 2:\t ${u.user_city}`);
        console.log(`\t📌 Country:\t\t ${u.user_country}`);
        console.log(`\t📌 SIREN number:\t ${u.user_siren}`);
        console.log(`\t📌 TVA Number:\t\t ${u.user_tva_number}`);
        console.log(`\t📌 IBAN:\t\t ${u.user_iban}`);
        console.log(`\t📌 BIC:\t\t\t ${u.user_bic}`);
    }
    console.log("\n")
}

const removeUser = async (user_list) => {
    if (user_list.length == 0) {
        console.log(`❌  You don't have any users to remove`);
        return;
    }
    let choices = [];
    for (let u of user_list) {
        choices.push({ name: u.user_full_name, value: `${u.user_full_name.replace(' ', '-')}.json` });
    }

    const answer = await checkbox({
        message: 'Select user(s) to remove',
        choices: choices
    });

    for (let a of answer) {
        fs.unlinkSync(`${USER_FOLDER}/${a}`)
        console.log(`🗑️  Deleted ${a} !`);
    }
}

export const userManagement = async (argv) => {
    let registered_users = await loadUsers();
    console.log(`✨ You have ${registered_users.length} users !`);
    for (let u of registered_users) {
        console.log(`\t🤵 ${u.user_full_name}`)
    }
    console.log("\n")
    // console.log(`You have ${registered_users.length} registered users`);
    const choice = await select({
        message: 'What do you want to do ?',
        choices: [
            {
                name: 'Add an user',
                value: 'add',
            },
            {
                name: 'Remove an user',
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
            await addUser();
            break;
        case "remove":
            await removeUser(registered_users);
            break;
        case "list":
            displayUserList(registered_users)
            break;
    }


}