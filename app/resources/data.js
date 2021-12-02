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

const select_column = async (column, column_page, company_id) => {
  try {
    const request = new sql.Request()
    const sql_sc = `
      SELECT distinct ${column} ${company_id ? ',coid' : ''}
      FROM hero_program.dbo.universal_finance_statement_dev_hdd 
      ${company_id ? `WHERE coid  = '${company_id}'` : ''}
      order by ${column}
      OFFSET ${column_page * 20} ROWS 
      FETCH NEXT 20 ROWS ONLY;`
    console.log(sql_sc)
    const result = await request.query(sql_sc)
    const data = result.recordsets[0].map(items => `[${items[column]}]`).filter(data => data != '[]').join(',')
    console.log(data)
    return data
  } catch (err) {
    console.log(err)
  }
}

const runQuery = async (column, row, start_date, end_date, company_id, row_page, column_page) => {
  try {
    const request = new sql.Request()
    const col = await select_column(column, column_page, company_id)
    const sql_sc = `
      SELECT 
          *
      FROM (
        SELECT
        [acc_value],[mdate],${row},[${column}]
        FROM dbo.universal_finance_statement_dev_hdd
        WHERE (mdate BETWEEN '${start_date || 20200301}' and '${end_date || 22000301}')
      ) DataResults
      PIVOT (
        SUM([acc_value])
        FOR [${column}]
        IN (${col})
        ) AS PivotTable
        order by mdate
        OFFSET ${row_page * 20} ROWS 
        FETCH NEXT 20 ROWS ONLY;
        `
    console.log(sql_sc)
    const result = await request.query(sql_sc)
    console.log(result)
    return result
  } catch (err) {
    console.log(err)
  }
}
exports.main = async function (event, context) {
  console.log(event)
  const body = JSON.parse(event.body);
  const origin = event.multiValueHeaders.origin || '*'
  const column = body.column;
  const row = body.row.map(data => `[${data}]`).filter(data => data!='[mdate]');
  const start_date = body.start_date;
  const end_date = body.end_date;
  const company_id = body.company_id;
  const row_page = body.row_page && body.row_page > 0 ? body.row_page - 1 : 0;
  const column_page = body.column_page && body.column_page > 0 ? body.column_page - 1 : 0;
  try {
    await sql.connect(sqlConfig)
    const response = await runQuery(column, row, start_date, end_date, company_id, row_page, column_page);
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE'
      },
      body: JSON.stringify(response.recordset)
    };
  } catch (err) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE'
      },
      body: JSON.stringify([])
    };
  }
}
