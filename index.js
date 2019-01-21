/**
 * Triggered from a change to a Cloud Storage bucket.
 *
 * @param {!Object} event Event payload and metadata.
 * @param {!Function} callback Callback function to signal completion.
 */


 const {Storage} = require('@google-cloud/storage');

 exports.notifySlack = (event, callback) => {

   const createMessage = function( date, projectNames, costs ) {
    var msg = "```";
    const y = date.getFullYear();
    const m = ("0"+(date.getMonth()+1)).slice(-2);
    const d = Number(("0"+(date.getDate())).slice(-2));
    const h = ("0"+(date.getHours())).slice(-2);
    const min = ("0"+(date.getMinutes())).slice(-2);
    msg += `\n${y}年${m}月${d}日${h}時${min}分-${d+1}日${h}時${min}分`;
    var sum = 0;
    projectNames.forEach( (pjn,i) => {
      sum += costs[i];
      msg += `\n${pjn}\t|請求額 : ${Math.ceil(costs[i])}円`;
    });
    msg += `\n合計 : ${Math.ceil(sum)}円`;
    msg += `\n今月の合計 : これから実装円`;
    return msg+"\n```";
  }

  const sendMessage = function( token, ch_name, msg ) {
    var https       = require('https');
    var querystring = require("querystring")
    var data = querystring.stringify({
      token:   token,
      channel: ch_name,
      text:    msg
    });
    var options = {
      host:'slack.com',
      port:443,
      method:'POST',
      path:'/api/chat.postMessage',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': data.length
      }
    }
    var req = https.request(options,res=>{
      res.on('data', chunk=>{});
      res.on('end',  ()=>{  });
      res.on('error', err=>{ console.log(err); });
    });
    req.write(data);
    req.end();
  }
   const   projectNames = [ "dev-tky-fiot" ];
   const   slackAPIToken = process.env.SLACK_API_TOKEN;
   const   slackChannelName = process.env.SLACK_CHANNEL_NAME;
   var costs = new Array(projectNames.length).fill(0);
   var buffer = new Buffer('');
   const storage = new Storage({projectId: process.env.GCP_PROJECT});
   const bucket = storage.bucket(event.data.bucket);

   //当日分
   const remoteFile = bucket.file(event.data.name);
   remoteFile.createReadStream()
   .on('error',  err=>{ console.error(err); })
   .on('data', chunk=>{ buffer=Buffer.concat([buffer, chunk]) }) // Loading file
   .on('finish',  ()=>{
      var dailyBillingJson = JSON.parse(buffer);
      dailyBillingJson.forEach((b)=>{
        if (projectNames.indexOf(b.projectName) >= 0)
            costs[projectNames.indexOf(b.projectName)] += Number(b.cost.amount);
      });
      var message = createMessage(new Date(latest), projectNames, costs);
      sendMessage(slackAPIToken,slackChannelName,message);
    })
    .on('end',   ()=>{
      callback();
    });

};
