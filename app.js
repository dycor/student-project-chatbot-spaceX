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
    "Search for a launch":{
        items: "option1"
    },
    "Get the latest launch":{
        items: "option2"
    },
    "Search for a capsule":{
        items: "option3"
    },
    "About us":{
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
        builder.Prompts.choice(session,"Choose an option",menuItems,{listStyle:3});
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

//Dialogue de la recherche de la fusée
bot.dialog('option1',[
        function(session){
          builder.Prompts.text(session,`Input a launch code`);

        },
        function(session, results){
          // console.log('hello')

             SpaceX.getLaunchPad(results.response,function(err, info){
               if(err == null){
                  //Card
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
                                "text": "Lauch nam : "+info.full_name,
                                "size": "large"

                              },
                              {
                                  "type": "TextBlock",
                                  "text": "Id : "+info.status,
                                  "separation": "none"
                                },
                
                                {
                                  "type": "TextBlock",
                                  "text": "Area : "+info.location.name
                                },
                                {
                                  "type": "TextBlock",
                                  "text": "Latitude : "+info.location.latitude
                                },
                                {
                                  "type": "TextBlock",
                                  "text": "longtitude : "+info.location.longtitude
                                },
                                {
                                  "type": "TextBlock",
                                  "text": "Capsule: "+info.vehicles_launched,
                                  "separation": "none"
                                },
                                {
                                  "type": "TextBlock",
                                  "text": "Description : "+info.details
                                }
                            ]
                          }
                        }
                      ]
                    };

                //Affichage du résultat
                 session.send(card);
               }
             });
         }
]);

//Option 2 - Les des derniers lancements
bot.dialog('option2',[


      function (session) {
      session.sendTyping();
      SpaceX.getLatestLaunch(function (err, launch) {
          var adaptiveCardMessage = buildLaunchAdaptiveCard(launch, session);
          session.send(adaptiveCardMessage);
      });
  }

]);


//Dialogue de la recherche de la fusée
bot.dialog('option3',[
  function(session){
    builder.Prompts.text(session,`Enter a capsule code`);

  },
  function(session, results){
    // console.log('hello')

       SpaceX.getCapsule(results.response,function(err, info){
         if(err == null){
            console.log(results.response);
            console.log(info);
            //Card
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
                          "text": "Capsule : "+info.name,
                          "size": "large"

                        },
                        {
                            "type": "TextBlock",
                            "text": "Type : "+info.type,
                            "separation": "none"
                          },
                          {
                            "type": "TextBlock",
                            "text": "Crew capacity : "+info.crew_capacity
                          },
                          {
                            "type": "TextBlock",
                            "text": "Diameter",
                            "size":"Large",
                          },
                          {
                            "type": "TextBlock",
                            "text": "Meters : "+info.diameter.meters                          },
                          {
                            "type": "TextBlock",
                            "text": "Feet : "+info.diameter.feet,
                            "separation": "none"
                          }
                      ]
                    }
                  }
                ]
              };

          //Affichage du résultat
           session.send(card);
         }
       });
   }]);

// Option 4 - 'A propos de nous'
bot.dialog('option4',[
  function(session){
                session.sendTyping(); // Les trois points de chargement du message
                SpaceX.getCompanyInfo(function(err, info){ //Récupère les infos de la companie Space X
                    var card = {
                        "type": "message",
                        "attachments": [
                          {
                            "contentType": "application/vnd.microsoft.card.adaptive",
                            "content": {
                              "type": "AdaptiveCard",
                              "version": "1.0",
                              "body": [
                                { //Titre 'We are SpaceX
                                  "type": "TextBlock",
                                  "text": "We are "+info.name,
                                  "size": "large"
                                },
                                {   //Image de la photo visible dans la card
                                    "type": "Image",
                                    "url": "https://camo.githubusercontent.com/039d05b54e544e61fe6224b037d8d2818025e29f/68747470733a2f2f692e696d6775722e636f6d2f796d70753874352e6a7067",
                                    "imageSize": "small",
                                },
                                {   // Nom du dirigeant
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
                                    "text": "Number of launch site : "+info.launch_sites
                                  },
                                  {
                                    "type": "TextBlock",
                                    "text": "Number of test site: "+info.test_sites,
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

//Dialogue de présentation du bot - Dès l'ouverture du client
bot.dialog('presentation',[
  function(session){ session.send('Hello ! I\'m Wall-e ,the space-x chatbot  . Here is all of i can do for you:');}
]);



//  ----------------------------------


function buildLaunchAdaptiveCard(launch, session) {
    var adaptiveCardMessage = new builder.Message(session)
        .addAttachment({
            contentType: "application/vnd.microsoft.card.adaptive",
            content: {
                type: "AdaptiveCard",
                body: [
                    {
                        "type": "Container",
                        "items": [
                            {
                                "type": "TextBlock",
                                "text": launch.mission_name,
                                "weight": "bolder",
                                "size": "medium"
                            },
                            {
                                "type": "ColumnSet",
                                "columns": [
                                    {
                                        "type": "Column",
                                        "width": "auto",
                                        "items": [
                                            {
                                                "type": "Image",
                                                "url": launch.links.mission_patch_small,
                                                "size": "small",
                                                "style": "person"
                                            }
                                        ]
                                    },
                                    {
                                        "type": "Column",
                                        "width": "stretch",
                                        "items": [
                                            {
                                                "type": "TextBlock",
                                                "text": "Matt Hidinger",
                                                "weight": "bolder",
                                                "wrap": true
                                            },
                                            {
                                                "type": "TextBlock",
                                                "spacing": "none",
                                                "text": "Created {{DATE(2017-02-14T06:08:39Z, SHORT)}}",
                                                "isSubtle": true,
                                                "wrap": true
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "type": "Container",
                        "items": [
                            {
                                "type": "TextBlock",
                                "text": "Now that we have defined the main rules and features of the format, we need to produce a schema and publish it to GitHub. The schema will be the starting point of our reference documentation.",
                                "wrap": true
                            },
                            {
                                "type": "FactSet",
                                "facts": [
                                    {
                                        "title": "Board:",
                                        "value": "Adaptive Card"
                                    },
                                    {
                                        "title": "List:",
                                        "value": "Backlog"
                                    },
                                    {
                                        "title": "Assigned to:",
                                        "value": "Matt Hidinger"
                                    },
                                    {
                                        "title": "Due date:",
                                        "value": "Not set"
                                    }
                                ]
                            }
                        ]
                    }
                ],
                "actions": [
                    {
                        "type": "Action.ShowCard",
                        "title": "Set due date",
                        "card": {
                            "type": "AdaptiveCard",
                            "body": [
                                {
                                    "type": "Input.Date",
                                    "id": "dueDate"
                                }
                            ],
                            "actions": [
                                {
                                    "type": "Action.Submit",
                                    "title": "OK"
                                }
                            ]
                        }
                    },
                    {
                        "type": "Action.ShowCard",
                        "title": "Comment",
                        "card": {
                            "type": "AdaptiveCard",
                            "body": [
                                {
                                    "type": "Input.Text",
                                    "id": "comment",
                                    "isMultiline": true,
                                    "placeholder": "Enter your comment"
                                }
                            ],
                            "actions": [
                                {
                                    "type": "Action.Submit",
                                    "title": "OK"
                                }
                            ]
                        }
                    }
                ]
            }
        });
        return adaptiveCardMessage;
}
