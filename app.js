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

        //console.log(info);
        var i = 0,result = [], string="Nos derniers lancements \n\n";
        while (i<3) {

          //Formalisation du texte
          string += "Nom de la mission "+JSON.stringify(info[i].mission_name) +"  \n";
          string += "Date de la mission "+Date(info[i].launch_date_utc) +"  \n";
          string += "Site du lancement "+JSON.stringify(info[i].site_name_long) +"  \n";
          string += "Nom de la fusée "+JSON.stringify(info[i].rocket.rocket_name) +"  \n";
          string += "\n";
          i++;
        }
        //Résultat des lancements
    
            var card = {
                "type": "message",
                "text": "Plain text is ok, but sometimes I long for more...",
                "attachments": [
                  {
                    "contentType": "application/vnd.microsoft.card.adaptive",
                    "content": {
                      "type": "AdaptiveCard",
                      "version": "1.0",
                      "body": [
                        {
                          "type": "TextBlock",
                          "text": info[0].mission_name,
                          "size": "large"
                        },
                        {
                          "type": "TextBlock",
                          "text": "*Sincerely yours,*"
                        },
                        {
                          "type": "TextBlock",
                          "text": "Adaptive Cards",
                          "separation": "none"
                        }
                      ],
                      "actions": [
                        {
                          "type": "Action.OpenUrl",
                          "url": "http://adaptivecards.io",
                          "title": "Learn More"
                        }
                      ]
                    }
                  }
                ]
              };




        session.send(card);
    });
  }
]);



bot.dialog('option3',[
  function(session){ session.send("Vous êtes dans l'option 3")}
]);


bot.dialog('option4',[
  function(session){
                session.sendTyping();
                SpaceX.getCompanyInfo(function(err, info){
                    
                    //console.log(info);
                    var card = {
                        "type": "message",
                        "attachments": [
                          {
                            "contentType": "application/vnd.microsoft.card.adaptive",
                            "content": {
                              "type": "AdaptiveCard",
                              "version": "1.0",
                              "body": [
                                {
                                  "type": "TextBlock",
                                  "text": "We are "+info.name,
                                  "size": "large"
                                },
                                {
                                    "type": "Image",
                                    "url": "https://camo.githubusercontent.com/039d05b54e544e61fe6224b037d8d2818025e29f/68747470733a2f2f692e696d6775722e636f6d2f796d70753874352e6a7067",
                                    "imageSize": "small",
                                },
                                {
                                  "type": "TextBlock",
                                  "text": "CEO : "+info.founder
                                },
                                {
                                    "type": "TextBlock",
                                    "text": "Foundation date : "+info.founded,
                                    "separation": "none"
                                  },
                                  {
                                    "type": "TextBlock",
                                    "text": "Number launch site : "+info.launch_sites
                                  },
                                  {
                                    "type": "TextBlock",
                                    "text": "Number test site: "+info.test_sites,
                                    "separation": "none"
                                  },
                                  {
                                    "type": "TextBlock",
                                    "text": "Location",
                                    "size": "medium"
                                  },
                                  {
                                    "type": "TextBlock",
                                    "text": "Address : "+info.headquarters.address
                                  },
                                  {
                                    "type": "TextBlock",
                                    "text": "City : "+info.headquarters.city,
                                    "separation": "none"
                                  },
                                  {
                                    "type": "TextBlock",
                                    "text": "State : "+info.headquarters.state,
                                    "separation": "none"
                                  },
                                  {
                                    "type": "TextBlock",
                                    "text": "Team",
                                    "size": "medium"
                                  },
                                  {
                                    "type": "TextBlock",
                                    "text": "CTO : "+info.cto
                                  },
                                  {
                                    "type": "TextBlock",
                                    "text": "COO :"+info.coo,
                                    "separation": "none"
                                  },
                                  {
                                    "type": "TextBlock",
                                    "text": "CTO Propulsion :"+info.cto_propulsion,
                                    "separation": "none"
                                  },
                                  {
                                    "type": "TextBlock",
                                    "text": info.summary
                                  }
                              ],
                              "actions": [
                                {
                                  "type": "Action.OpenUrl",
                                  "url": "http://www.spacex.com/about",
                                  "title": "Learn More"
                                }
                              ]
                            }
                          }
                        ]
                      };
                      
                      session.send(card);
                });
         
    }
]);

//Dialogue de présentation du bot
bot.dialog('presentation',[
  function(session){ session.send('Bonjour  je suis le bot dédié à l\'API de Space-X.');}
]);