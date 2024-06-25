import { select, input } from "@inquirer/prompts";
import { loadClients } from "./clients.js";
import { loadUsers } from "./user.js";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import fs from "fs";
import { confirm } from '@inquirer/prompts';
import util from "util";
import { exec } from "child_process"
import { createSpinner } from 'nanospinner'


const execPromise = util.promisify(exec);

const TEMPLATES_FOLDER = "./templates"

function buildChoicesUser(users) {
    let res = [];
    for (let u of users) {
        res.push({ name: u.user_full_name, value: u });
    }
    return res;
}

function buildChoicesClient(clients) {
    let res = [];
    for (let c of clients) {
        res.push({ name: c.client_full_name, value: c });
    }
    return res;
}

async function convertToPdf(inputDocxFile) {

    const command = `soffice --headless --convert-to pdf --outdir ./output ${inputDocxFile}`;
    try {
        const { stdout, stderr } = await execPromise(command);
    }
    catch (e) {
        console.error(e);
    }

}

const promptItems = async () => {
    console.log("📂 Invoice items:")
    let items = [];
    while (true) {
        console.log("\t📍 Item n°1");
        const item_title = await input({ message: 'Enter item title' });
        const item_qty = await input({ message: 'Enter item quantity', default: "1" });
        const item_rate = await input({ message: 'Enter item price' });
        const item_tva = await input({ message: 'Enter item TVA %', default: "0 %" });
        let total_ht = parseFloat(item_qty) * parseFloat(item_rate);
        items.push({
            title: item_title,
            qty: item_qty,
            rate: `${parseInt(item_rate).toFixed(2)}€`,
            tva: item_tva,
            total_ht: `${total_ht.toFixed(2)}€`,
        })


        const add_more = await confirm({ message: 'Add more items ?' });
        if (!add_more) {
            break;
        }
    }
    return items;

}

export async function loadTemplates() {
    try {
        let res = [];
        var files = fs.readdirSync(TEMPLATES_FOLDER);
        for (let i = 0; i < files.length; i++) {
            let template_file = files[i];
            res.push({ name: template_file, value: template_file });
        }
        return res;
    }
    catch (e) {
        console.log(e);
        return [];
    }
}


export const invoiceManagement = async (argv) => {

    const templates = await loadTemplates();
    const users = await loadUsers();
    const clients = await loadClients();

    if (templates.length == 0) {
        console.log(`❌  Please add at least one template`);
        return;
    }

    if (users.length == 0) {
        console.log(`❌  Please create at least one user`);
        return;
    }
    if (clients.length == 0) {
        console.log(`❌  Please create at least one client`);
        return;
    }

    const template = await select({
        message: "Choose a template",
        choices: templates
    });

    const user = await select({
        message: 'Choose an user profile',
        choices: buildChoicesUser(users),
    });

    const client = await select({
        message: "Choose a client",
        choices: buildChoicesClient(clients),
    })
    const invoice_number = await input({ message: 'Enter invoice number' });
    const devis_number = await input({ message: 'Enter bill number' });

    const invoice_title = await select({
        message: 'Invoice title',
        choices:
            [{ name: "Facture de solde", value: "Facture de solde" },
            { name: "Facture d'acompte", value: "Facture d'acompte" }]
    });

    const date_emission = await input({ message: 'Enter issue date (default: today)', default: new Date().toLocaleDateString() });
    const date_limit = await input({ message: 'Enter payment deadline (default: in 30 days)', default: new Date(new Date().getTime() + (1000 * 60 * 60 * 24 * 30)).toLocaleDateString() });


    const items = await promptItems();
    let total = 0;
    for (let i of items) {
        total += parseInt(i.total_ht.slice(0, -4));
    }


    // Load the docx file as binary content
    const content = fs.readFileSync(`${TEMPLATES_FOLDER}/${template}`,
        "binary"
    );

    // Unzip the content of the file
    const zip = new PizZip(content);

    // This will parse the template, and will throw an error if the template is
    // invalid, for example, if the template is "{user" (no closing tag)
    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
    });

    doc.render({
        user_full_name: user.user_full_name,
        user_address: user.user_address,
        user_city: user.user_city,
        user_country: user.user_country,

        client_full_name: client.client_full_name,
        client_address: client.client_address,
        client_city: client.client_city,
        client_country: client.client_country,

        user_siren: user.user_siren,
        user_tva_number: user.user_tva_number,

        invoice_number: invoice_number,
        devis_number: devis_number,
        date_emission: date_emission,
        date_limit: date_limit,

        invoice_title: invoice_title,

        iban: user.user_iban,
        bic: user.user_bic,

        items: items,
        total_ht: `${total.toFixed(2)}€`,
        total_tva: `0.00€`,
        total: `${total.toFixed(2)}€`,

    });

    // Get the zip document and generate it as a nodebuffer
    const buf = doc.getZip().generate({
        type: "nodebuffer",
        // compression: DEFLATE adds a compression step.
        // For a 50MB output document, expect 500ms additional CPU time
        compression: "DEFLATE",
    });

    // buf is a nodejs Buffer, you can either write it to a
    // file or res.send it with express for example.
    fs.writeFileSync(`./output/${invoice_number}.docx`, buf);

    const convert = await confirm({ message: 'Convert to pdf ?' });
    if (convert) {
        console.log("\n");
        const spinner = createSpinner('Converting to pdf...').start();

        await convertToPdf(`./output/${invoice_number}.docx`);
        spinner.success();

    }






}



