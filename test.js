
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

console.log(customPluralize("casa"))
console.log(customPluralize("aceite"))
console.log(customPluralize("abeztruz"))
console.log(customPluralize("lápiz"))
console.log(customPluralize("árbol"))
console.log(customPluralize("bisturí"))
console.log(customPluralize("tabú"))
console.log(customPluralize("rey"))
console.log(customPluralize("ley"))
console.log(customPluralize("jersey"))
console.log(customPluralize("vals"))
console.log(customPluralize("compás"))
console.log(customPluralize("césped"))
console.log(customPluralize("cáliz"))
console.log(customPluralize("reloj"))
console.log(customPluralize("club"))
console.log(customPluralize("máster"))
console.log(customPluralize("récord"))
console.log(customPluralize("milor"))
console.log(customPluralize("déficit"))



function isSingular(input) {
    if(input && input != "") {
        if(input.endsWith("s")) return false;
        else return true;
    } else {
        return null;
    }
}