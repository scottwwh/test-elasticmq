const namesString = 
`Samira Hawes
Nusaybah Hunter
Meadow Hines
Maryam Salinas
Adeline Dawson
Findlay Lyons
Denise Gates
Jermaine Parker
Alfie-Jay Steadman
Jamie-Lee Villarreal
Dora Knight
Grover Huang
Elisha Lim
Carlie Broadhurst
Ryker Suarez
Ezekiel Craig
Roland Robertson
Kaila Cochran
Otis Pratt
Melvin Callahan
Curtis Day
Saira Perry
Adem Hastings
Lesley Mitchell
Mahima Anthony
Brandy Pham
Jardel Cardenas
Holly Fenton
Aqib Wills
Finnian Reyna
Chace Houston
Esme Wilks
Saba Hatfield
Ella-May Findlay
Tylor Lucero
Tiegan Strickland
Ammarah Gallegos
Thelma Whitehouse
Lilly-Rose O'Sullivan
Zayden Mccoy
Wasim Betts
Sumayyah Palmer
Karolina Alvarez
Kyla Armitage
Tayyibah Sloan
Iyla Mcgee
Soraya Davey
Scarlett-Rose Guzman
Farrah Flowers
Hashir Oneal`

class Names {
    constructor(string) {
        this.names = namesString.split('\n').map(name => {
            return name.split(' ');
        });
    }

    getRandom() {
        const first = Math.floor(Math.random() * this.names.length);
        const last = Math.floor(Math.random() * this.names.length);
        return `${this.names[first][0]} ${this.names[last][1]}`;
    }
}

const names = new Names(namesString);

module.exports = names;