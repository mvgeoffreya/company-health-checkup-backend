const AWS = require('aws-sdk');
const sql = require('mssql')
const sqlConfig = {
  user: 'admin',
  password: 'heroa123',
  database: 'hero_program',
  server: 'group-a-trial-db.c9sqm2fhjpfh.ap-northeast-1.rds.amazonaws.com',
  options: {
    encrypt: true, // for azure
    trustServerCertificate: false // change to true for local dev / self-signed certs
  }
}

exports.main = async function (event, context) {
  console.log(event)
  await sql.connect(sqlConfig)
  const origin = event.multiValueHeaders.origin || '*'
  const request = new sql.Request()
    const sql_sc = `
      SELECT distinct coid
      FROM hero_program.dbo.universal_finance_statement_dev_hdd;`
    console.log(sql_sc)
    const result = await request.query(sql_sc)
    const data = result.recordsets[0].map(items => `${items.coid}` )
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Origin': origin[0],
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE'
    },
    body: JSON.stringify(data)
  };
}
