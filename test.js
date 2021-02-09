const axios = require('axios')
const wrURL = 'https://www.wordreference.com/definicion/'
const cheerio = require('cheerio')

//Extraemos la definición de una palabra
function getDefinition(word) {
    return new Promise((resolve, reject) => {
        axios.get(wrURL +  encodeURI(word)).then(({ data: HTML }) => {
            var $ = cheerio.load(HTML)
            var result = {}
            result.inflexiones = $('div.inflectionsSection').text()
            resolve(result)
        }).catch(err => {
            console.log("Error when trying to get data online", err)
            reject(err)
        })
    })
}

//Devuelve el singular y el plural de una palabra en concretos
async function getSingularAndPlural(word) {
    let definition = await getDefinition(word);
    if(definition != null && definition["inflexiones"] != null) {
        let inflexiones = definition["inflexiones"];
        inflexiones = inflexiones.trim();
        inflexiones = inflexiones.replace("\n", "");
        let items = inflexiones.split("Inflexiones de");
        
        //first get singular
        let singular;
        for(let item of items) {
            //const reg = new RegExp("\\'(?[\\s\\S]*)\\'", "gm");
            const regex = /'(?<sing>[\s\S]*)'/gi
            while ((result = regex.exec(item))) {
                if(result.groups != null && result.groups.sing != null) {
                    singular = result.groups.sing;
                    break;
                }
            }
            if (singular) break;
        }
        
        //After get plural
        let plurals = [];
        for(let item of items) {
            if(item.includes("pl: ")) {
                let temp = item.match(new RegExp("(?<=pl: ).*", "gm"));
                if(temp != null && temp.length > 0) {
                    temp = temp[0]
                    if(temp.includes("Del verbo")) {
                        temp = temp.match(new RegExp(".+?(?=Del verbo)", "gm"));
                        if(temp != null && temp.length > 0) temp = temp[0]
                    } 
                    plurals.push(temp);
                }
            }
        }
        return {
            singular: singular || "-",
            plural: plurals[0] || "-"
        }
    } else return null;
}

async function main() {
    const word = "naranja";
    console.log("Palabra a buscar: " + word);
    const result = await getSingularAndPlural(word);
    console.log("Resultado, singular: " + result["singular"] + ", plural: " + result["plural"]);
}

main();


//-----------------------------------------------------------------------
//Está función le falta el caso de la y, que existen dos causisticas.
//RAE: https://www.rae.es/dpd/plural
function customPluralize(input) {
    if(input && input != "" && input.length >= 2) {
        input = input.toLowerCase();
        const lastLetter = input[input.length -1];
        let temp;
        if(input.substring(input.length-2, input.length) == "ch") {
            //Procedentes todos ellos de otras lenguas, o bien se mantienen invariables en plural: (los) crómlech, (los) zarévich, (los) pech, 
            //o bien hacen el plural en -es: sándwich, pl. sándwiches; maquech, pl. maqueches.
            return input + "es";
        } else if(lastLetter == "y") {
            //hay casos que solo se debe añadir: es
            //otros casos que la y se sustituye por ies
        } else if(lastLetter == "z") {
            temp = input.substring(0, input.length - 1);
            return temp + "ces";
        } else if(["á","é","ó"].includes(lastLetter)) {
            if(lastLetter == "á" && ["faralá","albalá"].includes(input)) {
                temp = input.substring(0, input.length - 1);
                return temp + "aes";
            }
            return input + "s";
        } else if(["í","ú"].includes(lastLetter)) {
            //normalmente se sustituye por es pero hay casos para s, en el mundo culto es
            return input + "es";
        } else if(["s","x"].includes(lastLetter)) {
            //Si son monosílabos o polisílabos agudos, forman el plural añadiendo -es: 
            //tos, pl. toses; vals, pl. valses, fax, pl. faxes; compás, pl. compases; francés, pl. franceses. 
            if(["á","é","í","ó","ú"].includes(input[input.length -2])) {
                switch(input[input.length -2]) {
                    case "á":
                        return input.substring(0, input.length - 2) + "a" + input[input.length -1] + "es";
                    case "é":
                        return input.substring(0, input.length - 2) + "e" + input[input.length -1] + "es";
                    case "í":
                        return input.substring(0, input.length - 2) + "i" + input[input.length -1] + "es";
                    case "ó":
                        return input.substring(0, input.length - 2) + "o" + input[input.length -1] + "es";
                    case "ú":
                        return input.substring(0, input.length - 2) + "u" + input[input.length -1] + "es";
                    default:
                        return input + "es";
                }
            } else {
                return input + "es";
            }
        } else if(["l","r","n","d","j"].includes(lastLetter)) {
            return input + "es";
        } else if(!["l","r","n","d","z","j","s","x","a","e","i","o","u","á","é","í","ó","ú"].includes(lastLetter)) {
            //consonates que no sean ninguna de las siguientes añadir s, exepto club que puede ser clubs o clubes,
            //o imám i álbum
            if(["imam","imán","álbum","album"].includes(input)) return input + "es";
            else return input + "s";
        } else {
            //por defecto s
            return input + "s";
        }
    } else {
        return null;
    }
}

// ----------------------------------------------------------------------
//A partir de aquí es por si queremos crear una base de datos en elastic.
const { Client } = require('@elastic/elasticsearch')
const client = new Client({ node: 'http://localhost:9200' })
var crypto = require('crypto');

async function entryOnElastic(word) {
    let singular;
    let plural;
    if(word["singular"] != null && word["singular"] != "-") singular = word["singular"]
    if(word["plural"] != null && word["plural"] != "-") plural = word["plural"]
    if(singular == null && plural == null) return false;
    //Necesitamos el hash para poder controlar los duplicados, 
    //en elastic después de una entrada hay un segundo que si intentamos meter un objeto igual al annterior sin id, es possible que lo duplicamos.
    //Para que no nos pase ese caso, creamos el hash y al intentar meter un segundo caso igual como el id existe no se hará la entrada.
    const hash = crypto.createHash('md5').update(word["singular"] + word["plural"]).digest('hex');
    try {
        const result = await client.search({
            index: 'pluralize',
            body: {
                query: {
                    multi_match: { 
                        query: singular != null ? singular : plural, 
                        fields: [ "plural.keyword", "singular.keyword"] 
                    }
                }
            }
        })
        if(result.body["hits"]["total"]["value"] == 0) {
            const result = await client.index({
                index: 'pluralize',
                body: {
                    singular: singular,
                    plural: plural
                },
                id: hash
            })
            if(result.statusCode == 201) return true;
        }
        return false;
    } catch (error) {
        console.log(error);
        return false;
    }
}

//A partir de una lista de ingredientes (ingredients), te genera el sigunlar y el plural y los indexa.
//Es necesario disponer de un elastic, si tu url y puerto no son estos localhost:9200, debes cambiar la variable de arriba (client)
async function main2() {
    const ingredients = ["naranja", "tortilla", "cigüeña", "avestruz"]  //"await getIngredients()"; //Si usas una api para obtener una lista de ingredientes crea la función getIngredients
    let word;
    if(ingredients != null && ingredients.length > 0) {
        console.log("Ingredientes: ", ingredients.length);
        for(const ing of ingredients) {
            word = ing;
            const result = await getSingularAndPlural(word);
            if(result != null) {
                let state = await entryOnElastic(result);
                if(state) console.log("Palabra añadida: ", result);
                else console.log("Ya existe: ", result);
            } else console.log("El singular y el plural de: " + word + " no existe.");
        }
    } else {
        console.log("No hay ingredientes");
    }
}

//Descomentar para pruebas
//main2();