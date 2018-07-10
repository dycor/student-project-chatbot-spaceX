// 1 ) Appel du connecteur => Gère/Programme les interactions entre le Bot et le client .
var builder = require("botbuilder");

//Sauf que l'on a pas de module pour diffuser les messages à tous les intéragisseurs , on va appeler le module 'restify'
//2) Appeler un serveur RESTIFY pour broacast les messages => Envoyer des messages au BOT / d'en recevoir
var restify = require("restify");


const SpaceXAPI = require('SpaceX-API-Wrapper');

let SpaceX = new SpaceXAPI();



//Chaque serveur doit avoir un port d'écoute pour fonctionner .
//3) On crée un serveur en lui donnant un port d'écoute libre.
var server = new restify.createServer();
const port = process.env.PORT || 3978;

server.listen(port, function(){console.log(`Serveur sur écoute du port ${port} du serveur ${server.name}`);});

// 4) Configuration de notre BUILDER pour connecter le client avec bot.
//Par défaut 'ChatConnector' n'attend pas de paramètres
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// 5)   Créer notre route de dialogue avec une requête POST pour ENVOYER un message
//Dans celle-ci ,on dit que le BUILDER doit écouter les évènement à cette requête.
server.post("/api/messages", connector.listen());

// creation d'un unite de stockage
var inMemoryStorage = new builder.MemoryBotStorage();


// 6) Ouverture de la conversation.
//On y met nos dialogues sous forme de tableau de fonctions. Ces dialogues seront définis plus bas.
var bot = new builder.UniversalBot(connector, [
    function(session){
        //Cette fonction contient le dialogue "menu" programmé plus bas.
        session.beginDialog("menu");
    }
]).set('storage', inMemoryStorage);
//Définition de la mémoire de stockage pour nos DialogData , userData ou encore nos ConversionData.

// ------   LES DIALOGUES DE NOTRE BOT ----- //

/* Un objet initialisant le menu de notre dialogue suivant. Celui contient le contient la valeurs des rubriques de cemnu*/
const menuItems = {
    "Rechercher un lancement":{
        items: "option1"
    },
    "Présenter les derniers lancements":{
        items: "option2"
    },
    "Rechercher une fusée":{
        items: "option3"
    },
    "A propose de nous":{
        items: "option4"
    }
};

/*Celui effectue :
    - l'affichage du menu (menuItems) , l'obtention de la rubrique choisie.
    - Redirection vers un dialogue selon le lien du menu choisis.
*/
bot.dialog('menu',[
    //Etape1
    function(session){
        builder.Prompts.choice(session,"Choisissez une option de notre menu",menuItems,{listStyle:3});
        //Le prompt choisi affiche le lien du menu avec une mise en forme via l'attribut 'listStyle'.
    },
    function(session, results){
        var choice = results.response.entity;
        //Lien du menu relevé , si clique sur 'toto' , 'toto' sera stocké ici.
        //Pour ensuite être redirigé vers le nom du dialogue associé la rubrique 'toto' via 'menuItems[choice].items'
        session.beginDialog(menuItems[choice].items);
    }
]);

bot.on('conversationUpdate', function (message) {
    if (message.membersAdded) {
        message.membersAdded.forEach(function (identity) {
            // Bot is joining conversation
            if (identity.id === message.address.bot.id) {
                bot.beginDialog(message.address, 'presentation');
                bot.beginDialog(message.address, 'menu');
            }
        });
    }
});

/*--- Les dialogues de notre menu 'toto', 'titi' & 'tutu' ---*/
bot.dialog('option1',[
        function(session){ session.send('Vous êtes dans l\'option 1');}
]);
bot.dialog('option2',[
  function(session){
    SpaceX.getAllPastLaunches({},function(err, info){
        var i = 0,result = [], string="Nos derniers lancements \n\n";
        while (i<3) {

          //Formalisation du texte
          string += " Nom de la mission "+JSON.stringify(info[i].mission_name) +"  \n";
          string += " Date de la mission "+Date(info[i].launch_date_utc) +"  \n";
          string += " Site du lancement "+JSON.stringify(info[i].site_name_long) +"  \n";
          string += " Nom de la fusée "+JSON.stringify(info[i].rocket.rocket_name) +"  \n";
          string += "\n";
          i++;
        }
        //Résultat des lancements
        session.send(string);
    });
  }
]);



bot.dialog('option3',[
    function(session){ session.send("Vous êtes dans l'option 3")}
]);


var about = "La société SpaceX conçoit, construit et commercialise les lanceurs Falcon 9,\n les moteurs Merlin qui les propulsent ainsi que le vaisseau cargo Dragon et sa version habitée. \nLe lanceur Falcon 1 qui a été le premier lanceur de la société n'est plus en service. \nAprès trois échecs en 2006, 2007 et 2008, a lieu le 28 septembre 2008 le premier succès du lanceur Falcon 1, \nqui met ensuite en orbite le satellite d'observation malaisien RazakSAT lors de son cinquième vol, le 13 juillet 2009.";
bot.dialog('option4',[
    function(session){session.send(about);}
]);

// Add first run dialog
bot.dialog('presentation',[
        function(session){ session.send('Bonjour  je suis le bot dédié à l\'API de Space-X.');}
]);
