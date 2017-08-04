var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
var watson = require('watson-developer-cloud');
var app = express();
var deasync = require('deasync');

// ----------    codigo
app.use(bodyParser.urlencoded({ extended : true}))
app.use(bodyParser.json())
var RequestData={};
var wsOk;
var wsActive=0;
var conversation_id = "";
var contexto={};
var wsresponse = {};
var wsresponselogin = {};
var payloadlogin;
var temp;
var wslogin=0;
var tmpmenu=0;
var ctxsaldo,ctxestado,ctxtemp;
var numberInput;

var w_conversation = watson.conversation({
    url: 'https://gateway.watsonplatform.net/conversation/api',
    username: '8f62d0d6-6491-4c6f-9a11-ca151186e647',
    password: '2T6hKrbXy01g',
    version: 'v1',
    version_date: '2017-05-26'
});

var workspace = 'd0b3b7d7-6832-4e53-9079-0fc24ed6146e';

app.get('/webhook/', function(req,res){
    if(req.query['hub.verify_token']=='gofurther'){
        res.send(req.query['hub.challenge']);
    }
    console.log('error con token de validacion');
    res.send('Error con token de validacion');
});


app.post('/webhook/', function(req,res){
    var text = null;
    messaging_events = req.body.entry[0].messaging;
    console.log( 'req : ' +JSON.stringify(req.body));
    for(i=0;i<messaging_events.length;i++)
    {
        event = req.body.entry[0].messaging[i];
        console.log('event :'+ JSON.stringify(event));
        sender = event.sender.id;
        console.log ('sender :'+ JSON.stringify(sender));
        
        if(event.message && event.message.text)
        {
            text = event.message.text;
            console.log('evento de texto : ' + JSON.stringify(event));
        }else if (event.postback && !text)
        {
            text=event.postback.payload;            
            console.log('evento de postback : ' + JSON.stringify(event));
        }else
        {
            break;
        }

        var params = {
            workspace_id: workspace,
            input: text
        };

        var payload = {
            workspace_id: workspace,
            input:{ "text": text}};
/*
        if (params)
        {
            if(params.input)
            {   console.log('params input:' + JSON.stringify(params.input));
                console.log('payload input: ' + JSON.stringify(payload));
                params.input = params.input.replace('\n', '');
                payload.input = {"text" : params.input};
            }
            if(params.context)
            {   
                console.log('params ctx :'+ params.context);
                console.log('payload ctx :' + JSON.stringify(payload));
                payload.context = params.context;
            }
        }       
*/
        
        console.log('payload final :' + JSON.stringify(payload));
        console.log('sender final :' + JSON.stringify(sender));
        // Llamar al web service 

   EnviarAction(sender,"typing_on");

    if(wsActive==1)
    { 
        console.log('entro al wsactive = 1');
        
        login(payload,sender);
    }else if(wsActive==3)
    {
        
       console.log('entro al wsactive 3');
       temp= payload.input.text.split('+');
       if(temp[1]=='PREPAGO')
        {   payload.input.text=temp[0];
            ConsultarSaldosPrepago(payload,sender);
        }else
        {   
            ConsultaSaldosPostpago(payload,sender);
        }
        

    }else  if(payload.input.text=='volver')
        {
            if(tmpmenu==1)
            {
                     //GestorFB(sender,'(wssaldo)');
                    payload.input.text='saldo';
                   LlamarWatson(payload,sender);
            }
            else{
                   // GestorFB(sender,'(wsestado)');
                   payload.input.text='cuenta';
                   LlamarWatson(payload,sender);
            }
        } 
    else{
        console.log('entro active = 0');
        LlamarWatson(payload,sender);
    }
   }
    res.sendStatus(200);
});

//----------------------------------------------------------//
//                 LLAMADA A WATSON watson.js               //
//----------------------------------------------------------//

function LlamarWatson(payload,sender){
    
    ctxtemp = contexto;
    payload.context = contexto;
    console.log('Llamar a Watson Payload:'+ JSON.stringify(payload));
    console.log('Llamar a Watson Sender:'+ JSON.stringify(sender));
    console.log('varlor guardado de conversation ID :'+ conversation_id);
    console.log('varlor guardado del contexto :'+ JSON.stringify(contexto));
    
    w_conversation.message(payload,function(err,convRespuesta){
        if(err)
        {   
            console.log('Error watson : '+ JSON.stringify(err));
            return responseToRequest.send('Error');
        }
        if(convRespuesta.context!=null)
        {
            conversation_id=convRespuesta.context.conversation_id;
            contexto = convRespuesta.context;
            console.log('Respuesta de Watson val1 :' + JSON.stringify(convRespuesta));
        }
        if(convRespuesta!=null && convRespuesta.output!=null)
        {
            console.log('Respuesta de Watson val2:' + JSON.stringify(convRespuesta));
            var i=0;
            GestorFB(sender,convRespuesta.output.text.join("\n"));
           /* while(i<convRespuesta.output.text.length){
                if(sender,convRespuesta.output.text[i].length>0){
                 GestorFB(sender,convRespuesta.output.text[i++]);}
            }*/
        }
    });
}
//--------------------------------------------------------//
//                  FUTURO Ws.js                          //
//--------------------------------------------------------//

function login (payload, sender)
{
    console.log('Ingreso al servicio de Login');

    var temporal;
    RequestData = {
                    "Body":{  
                        "Request":{  
                            "Password":"AS/ZjOH54mtMc01ugJQtqQ==\n",
                            "PhoneNumber":"977878736"
                        }
                    },
                    "Header":{  
                        "AppVersion":"3.10.1",
                        "ApplicationId":"APPMOVIL",
                        "DeviceId":"3VGaUKufKj6ef8+r9o7UBA==\n",
                        "DeviceType":"ANDROID",
                        "DeviceVersion":"5.0",
                        "ServiceName":"Login"
                    }
                   };
    console.log("payload del servicio :" + payload);
console.log('Request data: '+ JSON.stringify(RequestData));
RequestData.Body.Request.PhoneNumber = payload.input.text;

numberInput = payload.input.text;

if(wslogin ==0){
request({ url : "https://i7z15ckf89.execute-api.us-east-1.amazonaws.com/v1/mobileservices2/rest/Login",
          method : "POST",
          json:true,
           headers: {
        "content-type": "application/json",
    },
    body: RequestData }, function (error, response, body) {
  console.log('error:', error); // Print the error if one occurred
  console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
  console.log( 'body :' , JSON.stringify(body)); // Print the HTML for the Google homepage.
  wsresponselogin = body;
  temporal = JSON.stringify(body);
    if(temporal.indexOf('Error')>=0)
        {
            console.log('Servicio con error');
            payload.input.text='invalido';
            LlamarWatson(payload,sender);
        }
        else
        {
            console.log('servicio sin error');
            payload.input.text='valido';
            payloadlogin = payload;
            LlamarWatson(payload,sender);
            wslogin =1;
            
        }
        });
    
}else {
            payload.input.text='valido';
            LlamarWatson(payload,sender);
            //wslogin=1;
}

wsActive =0;

}
function ConsultarSaldosPrepago(payload,sender)
{ 
console.log('Ingreso al servicio consultar saldos prepago');
    
    var temporal,strprepago;
RequestData = {  
   "Body":{  
      "Request":{  
         "ContactLogin": "99955555"
      }
   },
   "Header":{  
      "AppVersion":"3.10.1",
      "ApplicationId":"APPMOVIL",
      "DeviceId":"3VGaUKufKj6ef8+r9o7UBA==\n",
      "DeviceType":"ANDROID",
      "DeviceVersion":"5.0",
      "ServiceName":"GetPrepaidBalance"
   }
};
console.log("payload del servicio :" + payload);
console.log('Request data: '+ JSON.stringify(RequestData));
RequestData.Body.Request.ContactLogin = payload.input.text;

request({ url : "https://i7z15ckf89.execute-api.us-east-1.amazonaws.com/v1/mobileservices2/rest/GetPrepaidBalance",
          method : "POST",
          json:true,
           headers: {
        "content-type": "application/json",
    },
    body: RequestData }, function (error, response, body) {
  console.log('error:', error); // Print the error if one occurred
  console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
  console.log( 'body :' , JSON.stringify(body)); // Print the HTML for the Google homepage.
    wsresponse = body;
    //EnviarTextoFB(sender,'Su saldo es '+ JSON.stringify(wsresponse));
    temporal = JSON.stringify(body);
    if(temporal.indexOf('Error')>=0)
        {
            console.log('Servicio con error');            
           //payload.input.text='invalido';
          // LlamarWatson(payload,sender);           
        }
        else 
        {
            console.log('servicio sin error');
            //payload.input.text='valido';
            //LlamarWatson(payload,sender);
           for (y=0; y<wsresponse.Body.Response.PrepaidBalances.length ;y++)
            {
                if(y==0){
                    strprepago =  wsresponse.Body.Response.PrepaidBalances[y].TypeBalance[0].Title +'+'+wsresponse.Body.Response.PrepaidBalances[y].Balance;   
                }else{                
                    strprepago =strprepago+ '|'+ wsresponse.Body.Response.PrepaidBalances[y].TypeBalance[0].Title +'+'+wsresponse.Body.Response.PrepaidBalances[y].Balance;
                    
               
                }
           
                console.log('string prepago :' + strprepago);
            }
            if(wsresponse.Body.Response.PrepaidBalances.length > 1)
                {
            DibujarLista(sender,strprepago);}
            else{
                strprepago =  wsresponse.Body.Response.PrepaidBalances[0].TypeBalance[0].Title +' : '+wsresponse.Body.Response.PrepaidBalances[0].Balance; 
                //EnviarTextoFB(sender,strprepago);

                EnviarQRsaldo(sender,strprepago);
            }

        }
        });
wsActive =0;

}



    function ConsultaSaldosPostpago(payload, sender)
    {
     var temporal;
     var strpostpago;
     var aux;
    RequestData= {  
                    "Body":{  
                        "Request":{  
                            "PhoneNumber":"977878736",
                            "PhoneType":"POSTPAGO"
                        }
                    },
                    "Header":{  
                        "AppVersion":"3.10.1",
                        "ApplicationId":"APPMOVIL",
                        "DeviceId":"3VGaUKufKj6ef8+r9o7UBA==\n",
                        "DeviceType":"ANDROID",
                        "DeviceVersion":"5.0",
                        "ServiceName":"GetTariffPlan"
                    }
                };
                console.log("payload del servicio :" + payload);
                console.log('Request data: '+ JSON.stringify(RequestData));
                aux =  payload.input.text.split('+');
                RequestData.Body.Request.PhoneNumber = aux[0];
                RequestData.Body.Request.PhoneType = aux[1];

                request({ url : "https://i7z15ckf89.execute-api.us-east-1.amazonaws.com/v1/mobileservices2/rest/GetTariffPlan",
                        method : "POST",
                        json:true,
                        headers: {
                        "content-type": "application/json",
                    },
                    body: RequestData }, function (error, response, body) {
                console.log('error:', error); // Print the error if one occurred
                console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
                console.log( 'body :' , JSON.stringify(body)); // Print the HTML for the Google homepage.
                    wsresponse = body;
                 
                    temporal = JSON.stringify(body);
                    if(temporal.indexOf('Error')>=0)
                        {
                            console.log('Servicio con error');
                           // payload.input.text='invalido';
                            LlamarWatson(payload,sender);
                        }
                        else
                        {
                            console.log('servicio sin error');
                           // payload.input.text='valido';
                           // LlamarWatson(payload,sender);
                            for (y=0; y<wsresponse.Body.Response.PlanDetail.ServicePlanDetail[0].Detail.length ;y++)
                                {
                                    

                                    if(y==0){
                                        strpostpago = wsresponse.Body.Response.PlanDetail.ServicePlanDetail[0].Detail[y].Description +'+' +wsresponse.Body.Response.PlanDetail.ServicePlanDetail[0].Detail[y].Balance;
                                    }else{
                                        strpostpago = strpostpago+'|'+wsresponse.Body.Response.PlanDetail.ServicePlanDetail[0].Detail[y].Description +'+' +wsresponse.Body.Response.PlanDetail.ServicePlanDetail[0].Detail[y].Balance;
                                    }

                                 }
                                DibujarLista(sender,strpostpago);
                        }});
                wsActive =0;
}

function Recibo(payload,sender)
{ var temporal;
    RequestData= {  
                    "Body":{  
                        "Request":{  
                            "CsId":"239452",
                            "CustCode":"5.10943.00.00.100001",
                            "CustomerIdCrm":"30274",
                            "PhoneNumber":"0",
                            "TokenId":"TOKEN"
                        }
                    },
                    "Header":{  
                        "AppVersion":"4.0",
                        "ApplicationId":"APPMOVIL",
                        "DeviceId":"pFkF/76uRRLcR9q3gnvRsA==\n",
                        "DeviceType":"ANDROID",
                        "DeviceVersion":"5.1",
                        "ServiceName":"getPaymentReceipt"
                    }
                 };
                console.log("payload del servicio :" + payload);
                console.log('Request data: '+ JSON.stringify(RequestData));
                RequestData.Body.Request.CsId = wsresponselogin.Body.Response.PaymentResponsibles[0].CsId;
                RequestData.Body.Request.CustCode = wsresponselogin.Body.Response.PaymentResponsibles[0].CustCode;
                RequestData.Body.Request.CustomerIdCrm =wsresponselogin.Body.Response.CustomerIdCrm;
                RequestData.Body.Request.TokenId=wsresponselogin.Body.Response.TokenId;

                request({ url : "https://i7z15ckf89.execute-api.us-east-1.amazonaws.com/v1/mobileservices2/rest/getPaymentReceipt",
                        method : "POST",
                        json:true,
                        headers: {
                        "content-type": "application/json",
                    },
                    body: RequestData }, function (error, response, body) {
                console.log('error:', error); // Print the error if one occurred
                console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
                console.log( 'body :' , JSON.stringify(body)); // Print the HTML for the Google homepage.
                    wsresponse = body;
                    //EnviarTextoFB(sender,'Su saldo es '+ JSON.stringify(wsresponse));
                    temporal = JSON.stringify(body);
                    if(temporal.indexOf('Error')>=0)
                        {
                            console.log('Servicio con error');
                            payload.input.text='invalido';
                            LlamarWatson(payload,sender);
                        }
                        else
                        {
                            console.log('servicio sin error');
                            payload.input.text='valido';
                            LlamarWatson(payload,sender);
                        }
                        });
                wsActive =0;
            }

function DeudaTotal(sender)
{
         var temporal;
         var strtemporal;
    RequestData= {  
                        "Body":{  
                            "Request":{  
                                "CsId":"239452",
                                "CustCode":"5.10943.00.00.100001",
                                "CustomerIdCrm":"30274",
                                "PhoneNumber":"0",
                                "TokenId":"TOKEN"
                            }
                        },
                        "Header":{  
                            "AppVersion":"4.0",
                            "ApplicationId":"APPMOVIL",
                            "DeviceId":"pFkF/76uRRLcR9q3gnvRsA==\n",
                            "DeviceType":"ANDROID",
                            "DeviceVersion":"5.1",
                            "ServiceName":"getPaymentReceipt"
                        }
                   };

              //  console.log("payload del servicio :" + payload);
                console.log('Request data: '+ JSON.stringify(RequestData));
                //RequestData.Body.Request.TokenId = payload.input.text;
                RequestData.Body.Request.CsId = wsresponselogin.Body.Response.PaymentResponsibles[0].CsId;
                RequestData.Body.Request.CustCode = wsresponselogin.Body.Response.PaymentResponsibles[0].CustCode;
                RequestData.Body.Request.CustomerIdCrm =wsresponselogin.Body.Response.CustomerIdCrm;
                RequestData.Body.Request.TokenId=wsresponselogin.Body.Response.TokenId;
                
                
                request({ url : "https://i7z15ckf89.execute-api.us-east-1.amazonaws.com/v1/mobileservices2/rest/getTotalDue",
                        method : "POST",
                        json:true,
                        headers: {
                        "content-type": "application/json",
                    },
                    body: RequestData }, function (error, response, body) {
                console.log('error:', error); // Print the error if one occurred
                console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
                console.log( 'body :' , JSON.stringify(body)); // Print the HTML for the Google homepage.
                    wsresponse = body;
                    //EnviarTextoFB(sender,'Su saldo es '+ JSON.stringify(wsresponse));
                    temporal = JSON.stringify(body);
                    if(temporal.indexOf('Error')>=0)

                        {
                            console.log('Servicio con error');
                            //payload.input.text='invalido';
                            //LlamarWatson(payload,sender);
                            EnviarTextoFB(sender,temporal);
                        }
                        else
                        {
                            console.log('servicio sin error');
                            //payload.input.text='valido';
                            //LlamarWatson(payload,sender);
                            //EnviarTextoFB(sender,temporal);
                           /* EnviarTextoFB(sender, '1'+JSON.stringify(wsresponse.Body.Response.AccountStatement.AccountStatement.PaymentBalance));
                            EnviarTextoFB(sender, '2'+JSON.stringify(wsresponse.Body.Response.AccountStatement.BilledStarts));
                            EnviarTextoFB(sender, '3'+JSON.stringify(wsresponse.Body.Response.AccountStatement.BilledEnds));*/
                            strtemporal= 'Monto a pagar'+'+'+wsresponse.Body.Response.AccountStatement.PaymentBalance+'|'+'Fecha de inicio de facturación'+'+'+wsresponse.Body.Response.AccountStatement.BilledStarts+'|'+'Fecha de fin de facturación'+'+'+wsresponse.Body.Response.AccountStatement.BilledEnds;
                            console.log('strtemporal : '+ strtemporal);
                            DibujarLista(sender,strtemporal);
                            

                        }
                        });
                wsActive =0;

}

//--------------------------------------------------------//
//                  FUTURO FB.js                          //
//--------------------------------------------------------//
function GestorFB(sender, texto)
{
    var y=0;
  wsActive = 0;
   var newstr;
   codigo =0;
    console.log('texto :' + texto);
     if(texto.indexOf('(menuprincipal)')>=0)
    {
        if(texto.indexOf('(wsreinicio)')>=0)
            {
                texto = texto.substring(0,texto.indexOf('(wsreinicio)'));
                wslogin=0;
                contexto.locacion="";
                contexto.tipo_promo="";
                contexto=null;
            }
        newstr = texto.substring(0,texto.indexOf('(menuprincipal)'));
        if(newstr.length>0)
          {
             EnviarTextoFB(sender, newstr);
          }
        EnviarCarruselFB(sender);
    }else if(texto.indexOf('(menusecundario)')>=0)
    {
        newstr = texto.substring(0,texto.indexOf('(menusecundario)'));
        if(newstr.length>0)
          {
             EnviarTextoFB(sender, newstr);
          }
        EnviarCarruselFB(sender);
    } 
    else if(texto.indexOf('(menuportabilidad)')>=0)
    {
        newstr = texto.substring(0,texto.indexOf('(menuportabilidad)'));
        EnviarTextoFB(sender,newstr);
        Enviar_Menu_portabilidad(sender);

    }else if (texto.indexOf('(menuplanes)')>=0){
        newstr = texto.substring(0,texto.indexOf('(menuplanes)'));
        EnviarTextoFB(sender,newstr);
        Enviar_Menu_Planes(sender);
        
    }else if (texto.indexOf('(menullamar)')>=0){
        newstr = texto.substring(0,texto.indexOf('(menullamar)'));
        EnviarTextoFB(sender,newstr);
        Enviar_Menu_LLamar(sender);
        
    }else if(texto.indexOf('(wslogin)')>=0)
    {
        newstr = texto.substring(0,texto.indexOf('(wslogin)'));        
        EnviarTextoFB(sender, newstr);
        wsActive =2;
        
    }else if(texto.indexOf('(wssaldo)')>=0){
        if(wslogin==0){
        newstr = texto.substring(0,texto.indexOf('(wssaldo)'));        
        EnviarTextoFB(sender, newstr);
        wsActive=1;}
        else{
           // payloadlogin.context = ctxsaldo;
            LlamarWatson(payloadlogin,sender);
        }
    }else if(texto.indexOf('(wssaldoresponse)')>=0)
    {
        //ctxsaldo= ctxtemp;
        var arreglo={};
        var data1=[];
        var strtemp="";
        newstr = texto.substring(0,texto.indexOf('(wssaldoresponse)'));  
        EnviarTextoFB(sender,newstr);


        for(y=0; y<wsresponselogin.Body.Response.AffiliateNumbers.length ;y++)
            {
                var myPhone = wsresponselogin.Body.Response.AffiliateNumbers[y].PhoneNumber;

                if(myPhone==numberInput){
                        strtemp = wsresponselogin.Body.Response.AffiliateNumbers[y].PhoneNumber +'+' +wsresponselogin.Body.Response.AffiliateNumbers[y].PhoneType+'+'+wsresponselogin.Body.Response.AffiliateNumbers[y].PlanDescription;
                }

                // if(y==0){
                //         strtemp = wsresponselogin.Body.Response.AffiliateNumbers[y].PhoneNumber +'+' +wsresponselogin.Body.Response.AffiliateNumbers[y].PhoneType+'+'+wsresponselogin.Body.Response.AffiliateNumbers[y].PlanDescription;
                // }
                // else{
                //     strtemp =strtemp +'|'+wsresponselogin.Body.Response.AffiliateNumbers[y].PhoneNumber +'+' +wsresponselogin.Body.Response.AffiliateNumbers[y].PhoneType+'+'+wsresponselogin.Body.Response.AffiliateNumbers[y].PlanDescription;
                // }
           }  
           console.log('data :' + JSON.stringify(strtemp));
           Enviar_carrusel_principal(sender,strtemp);
           tmpmenu =1;

    }else if(texto.indexOf('(wsestado)')>=0){
        if(wslogin==0){
        newstr = texto.substring(0,texto.indexOf('(wsestado)'));        
        EnviarTextoFB(sender, newstr);
        wsActive=1;}
        else{
            //payloadlogin.context =ctxestado;
            LlamarWatson(payloadlogin,sender);
            
        }
    }else if(texto.indexOf('(wsestadoresponse)')>=0)
    { // ctxestado = ctxtemp;
        var arreglo={};
        var data1=[];
        var strtemp="";
        newstr = texto.substring(0,texto.indexOf('(wsestadoresponse)'));  
           MenuEC(sender,newstr);
           tmpmenu =2;        
    }else if (texto.indexOf('(wsimporte)')>=0)
    {   console.log('entro a  wsimporte');
        newstr = texto.substring(0,texto.indexOf('(wsimporte)'));        
        EnviarTextoFB(sender, newstr);
        DeudaTotal(sender);
    }else
    {
        EnviarTextoFB(sender, texto);
    }
}

function Enviar_Menu_LLamar(sender)
{
 messageData ={'attachment' : 
                            {
                            'type':'template',
                            'payload':{
                                'template_type':'generic',
                                'elements':[
                                    {
                                        'title':'Seleccione una opción',                    
                                        'buttons':[
                                            {
                                            'type':'phone_number',
                                            'title':'Llámanos',
                                            'payload':'+51947548447'
                                        },
                                        {
                                            'type':'postback',
                                            'title':'Regresar 🏠',
                                            'payload':'rellamado'
                                        }                 
                                        ]
                                    },
                                ]
                            }
                        }

};
                    EnviarMensajeFB(sender,messageData);
}

function Enviar_Menu_Planes(sender)
{
 messageData = {'attachment' : {
                            'type':'template',
                            'payload':{
                                'template_type':'generic',
                                'elements':[
                                    {
                                        'title':'Seleccione una opcion',                    
                                        'buttons':[
                                            {
                                            'type':'postback',
                                            'title':'Entel Libre 99',
                                            'payload':'papa'
                                        },
                                        {
                                            'type':'postback',
                                            'title':'Entel Libre 149',
                                            'payload':'camote'
                                        },
                                        {
                                            'type':'postback',
                                            'title':'Entel Libre 199',
                                            'payload':'tomate'
                                        }                 
                                        ]
                                    },
                                ]
                            }
                        }};

EnviarMensajeFB(sender,messageData);
}


function Enviar_Menu_portabilidad(semder)
{
    messageData ={'attachment': {
        'type': 'template',
        'payload': {
          'template_type': 'generic',
          'elements': [{
            'title': 'Puedes obtener mas información aquí:',
            'buttons': [{
              'type': 'postback',
              'title': '¿Cómo migrar?',
              'payload': 'migrar'
            }, {
              'type': 'postback',
              'title': 'Condiciones',
              'payload': 'condiciones',
            },
            { "type":"postback",
              "title":"Beneficios",
              "payload":"beneficios"
            }],
          }]
        }
    } };

    EnviarMensajeFB(sender,messageData);
}


function MenuEC(sender,titulo)
{
        messageData= {
                        "text":"Seleccione una de los siguientes opciones:",
                                "quick_replies":[
                                {
                                    "content_type":"text",
                                    "title":"Recibo",
                                    "payload":"recibo"
                                },
                                {
                                    "content_type":"text",
                                    "title":"Deuda Total",
                                    "payload":"importe"
                                }
                                ]                              
                };
messageData.text = titulo;
    EnviarMensajeFB(sender,messageData);
    wsActive=4;

}

function Enviar_carrusel_principal_estado(sender,strtemp)
{
var a;
var arreglo,info,imgprepago,imgpostpago,imgtmp;
imgprepago='http://www.dataoneperu.com/images/prepago.png';
imgpostpago='http://www.dataoneperu.com/images/postpago.png';
arreglo = strtemp.split('|');


    var objcarrusel = {
            "title": "Estado de cuenta",
            "subtitle" : "subtitulo",
            "buttons": [{
              "type": "postback",
              "title": "Recibo",
              "payload": "recibo"
            },{
              "type": "postback",
              "title": "Deuda Total",
              "payload": "deuda"
            }
        ],
          };


   var  messageData={'attachment' : {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": []
    }} 
  };

      for(a=0;a<=arreglo.length;a++)
    { 
        if(a<arreglo.length){
       
        info = arreglo[a].split('+');
       if(info[1]=='PREPAGO')
            {imgtmp = imgprepago;}
        else{ imgtmp = imgpostpago;}
        messageData.attachment.payload.elements[a] ={
            title: info[0],
            subtitle : info[1],
            image_url: imgtmp,
            buttons: [{
              type: "postback",
              title: "Recibo",
              payload: arreglo[a]
            },{
              type: "postback",
              title: "Deuda Total",
              payload: "Deuda"
            }],
          };
        console.log('messagedata :' + JSON.stringify(messageData));

        }else
        {EnviarMensajeFB(sender,messageData);
           
        wsActive=4;
        }
    }

}

function Enviar_carrusel_principal(sender,strtemp)
{
var a;
var arreglo,info,imgprepago,imgpostpago,imgtmp;
arreglo = strtemp.split('|');
imgprepago='http://www.dataoneperu.com/images/prepago.png';
imgpostpago='http://www.dataoneperu.com/images/postpago.png';

    var objcarrusel = {
            "title": "Estado de cuenta",
            "subtitle" : "subtitulo",
            "buttons": [{
              "type": "postback",
              "title": "Ver más..",
              "payload": "miinfo"
            }],
          };


   var  messageData={'attachment' : {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": []
    }} 
  };

      for(a=0;a<=arreglo.length;a++)
    { 
        if(a<arreglo.length){
       
        info = arreglo[a].split('+');
        if(info[1]=='PREPAGO')
            {imgtmp = imgprepago;}
        else{ imgtmp = imgpostpago;}

        messageData.attachment.payload.elements[a] ={
            title: info[0],
            subtitle : 'Tipo de Linea :' +info[1] + '\n' + 'Plan : ' + info[2] ,
            image_url: imgtmp,
            buttons: [{
              type: "postback",
              title: "Ver Saldos",
              payload: arreglo[a]
            }],
          };
        console.log('messagedata :' + JSON.stringify(messageData));

        }else
        {EnviarMensajeFB(sender,messageData);
        wsActive=3;
        }
    }

}

function DibujarLista(sender,strtemp)
{

    console.log('Entro a dibujar lista');
    var arreglo, info,a;
    arreglo = strtemp.split('|');

               messageData= {
                    "attachment": {
                        "type": "template",
                        "payload": {
                            "template_type": "list",
                            "top_element_style": "compact",
                            "elements": [],
                            "buttons": [
                                {
                                    "title": "Volver",
                                    "type": "postback",
                                    "payload": "volver"                        
                                }
                            ]  
                        }
                    }
                    };

    objlista= {
               "title": "Classic T-Shirt Collection1",
               "subtitle": "See all our colors"
               };


    for(a=0; a<=arreglo.length;a++)
        {
            if(a<arreglo.length)
                { info = arreglo[a].split('+');
                    messageData.attachment.payload.elements[a] = {
                        title: info[0],
                        subtitle: info[1]
                    };
                }else
                {
                    EnviarMensajeFB(sender,messageData);
                }
        }


}

function EnviarCarruselFB(sender)
{
   messageData ={'attachment' : {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [{
            "title": "Portabilidad",
            "image_url": "https://lh5.ggpht.com/xy3nhnCd80f9ucvCZTXMum6agyqObXu3lwYff-AxMaKxa7ot1WT7xPt--j7lqVmfDXy7=w300",
            "buttons": [{
              "type": "postback",
              "title": "Ver más..",
              "payload": "portabilidad"
            },],
          }, {
            "title": "Consulta de saldos",
            "image_url": "http://www.hites.com/wcsstore/HitesCAS/images/catalog/Hites_img_opti_400x400/7235870019_0.jpg",
            "buttons": [{
              "type": "postback",
              "title": "Ver más..",
              "payload": "saldos"
            }],
          },{
            "title": "Estado de cuenta",
            "image_url": "http://portal.infonavit.org.mx/wps/wcm/connect/fa9ce951-63c2-4a37-8c81-aa1e6da2cc33/bg_7.png?MOD=AJPERES&CACHEID=ROOTWORKSPACE-fa9ce951-63c2-4a37-8c81-aa1e6da2cc33-lDwQn0F",
            "buttons": [{
              "type": "postback",
              "title": "Ver más..",
              "payload": "cuenta"
            }],
          }]
    }} 
  };
  EnviarMensajeFB(sender,messageData);
}

function EnviarQRFB(sender)
{
    messageData= {
                        "text":"Seleccione una de los siguientes opciones:",
                                "quick_replies":[
                                {
                                    "content_type":"text",
                                    "title":"Portabilidad",
                                    "payload":"portabilidad"
                                },
                                {
                                    "content_type":"text",
                                    "title":"Consulta de saldos",
                                    "payload":"Saldos"
                                },{
                                   "content_type":"text",
                                   "title":"Estdo de Cuenta",
                                   "payload":"cuenta"
                                 }
                                ]                              
                };

    EnviarMensajeFB(sender,messageData);

}

function EnviarQRsaldo(sender,texto)
{
    messageData= {
                        "text":"Seleccione una de los siguientes opciones:",
                                "quick_replies":[
                                {
                                    "content_type":"text",
                                    "title":"volver",
                                    "payload":"volver"
                                }
                                ]                              
                };
    messageData.text = texto;

    EnviarMensajeFB(sender,messageData);

}

function EnviarTextoFB(sender, texto)
{
  texto = texto.substring(0,319);
  messageData = {text: texto};
  EnviarMensajeFB(sender,messageData);

}

function EnviarMensajeFB(sender,messageData){
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs:{ access_token: token},
        method: 'POST',
        json:{
            recipient: {id: sender},
            message:messageData
        }
    }, function(error,response, body){
        if(error){
            console.log('Error de envio de mensaje : ' + error);                      
        }
        else if(response.body.error){
            console.log('Error : '+ JSON.stringify(response.body.error));
        }

          EnviarAction(sender,"typing_off");

        console.log('Mensaje Facebook respuesta: ' + JSON.stringify(response));
    });
}

function EnviarAction(sender,_action){
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs:{ access_token: token},
        method: 'POST',
        json:{
             recipient: {id: sender},
            sender_action: _action
        }
    }, function(error,response, body){
        if(error){
            console.log('Error de envio de mensaje : ' + error);                      
        }
        else if(response.body.error){
            console.log('Error : '+ JSON.stringify(response.body.error));
        }

        console.log('Mensaje Facebook respuesta: ' + JSON.stringify(response));
    });
}


var token ='EAAbWwHSM2tsBAPe5d91cOzjU27hZB341jrxcrV6kyYVG8OQcIDYdSqcqnpRldS2JBaNcAnnyPlgpyddesv4P25jfAVsZAoU0uhfD007O2HoWdujzyOdLNPcU21IKMLT5EOSCeZBMDukeMHohKDK0cZA4UfZAooLVDFOjTTqmZAjC3MGQHd7o7p';
var host = (process.env.VCAP_APP_HOST || 'localhost');
var port = (process.env.VCAP_APP_PORT || 3000);
app.listen(port, host);