const express = require("express");
const axios = require("axios");
const qs = require("qs");
const cheerio = require("cheerio");
const cors = require("cors");
const { closeSync } = require("fs");
const fs = require("fs");
const pool = require('./Connection/Postgres');
const nodemailer = require("nodemailer");
const { log } = require("console");
// let failureCounter = 0;
const app = express();
const PORT = 8000;

app.use(express.json());
app.use(cors());

// Nodemailer transport configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "demo22864@gmail.com",
    pass: "vlsyaffctmbilfgd",
  },
});

// Function to send email when data insertion fails
async function sendSuccessEmail(recipientEmail) {
  const mailOptions = {
    from: "demo22864@gmail.com",
    to: recipientEmail,
    subject: "All Data has been sent",
    html: `<p>Dear User,</p><p>All data has been processed for the eway bill number. Kindly start a new session.</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Success email sent.");
  } catch (err) {
    console.error("Failed to send success email:", err);
  }
}



// Helper function to fetch dynamic form values
const fetchFormValues = async () => {
  const config = {
    method: "get",
    maxBodyLength: Infinity,
    url: "https://mis.ewaybillgst.gov.in/ewb_ctz/citizen/EnrolmentCitizen.aspx",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/png,image/svg+xml,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      Priority: "u=0, i",
    },
  };

  try {
    const response = await axios(config);
    const $ = cheerio.load(response.data);
    const viewState = $("#__VIEWSTATE").val();
    const viewStateGenerator = $("#__VIEWSTATEGENERATOR").val();
    const eventValidation = $("#__EVENTVALIDATION").val();
    const mytoken = $('input[name="ctl00$ContentPlaceHolder1$mytoken"]').val();
    const cookies = response.headers["set-cookie"];
    let cookiefirst = cookies.map((cookie) => cookie.split(";")[0]).join("; ");
    // console.log("cookie1 ..", cookiefirst);

    return {
      viewState,
      viewStateGenerator,
      eventValidation,
      cookiefirst,
      mytoken,
    };
  } catch (error) {
    // console.error("Error fetching form values:", error);
    throw error;
  }
};

app.post("/submit-form", async (req, res) => {
  const mobileNumber = req.body.mobileNumber;

  try {
    const {
      viewState,
      viewStateGenerator,
      eventValidation,
      cookiefirst,
      mytoken,
    } = await fetchFormValues();

    // console.log("Old form values ..", {
    //   viewState,
    //   viewStateGenerator,
    //   eventValidation,
    //   mytoken,
    //   cookiefirst,
    // });

    const data = qs.stringify({
      __EVENTTARGET: "ctl00$ContentPlaceHolder1$btnNoAadharSendOTP",
      __EVENTARGUMENT: "",
      __LASTFOCUS: "",
      __VIEWSTATE: viewState,
      __VIEWSTATEGENERATOR: viewStateGenerator,
      __SCROLLPOSITIONX: "0",
      __SCROLLPOSITIONY: "289",
      __VIEWSTATEENCRYPTED: "",
      __EVENTVALIDATION: eventValidation,
      ctl00$ContentPlaceHolder1$mytoken: mytoken,
      ctl00$ContentPlaceHolder1$ddlState: "",
      ctl00$ContentPlaceHolder1$txtLegalName: "",
      ctl00$ContentPlaceHolder1$txtPanNo: "",
      ctl00$ContentPlaceHolder1$txtPPBBuildingno: "",
      ctl00$ContentPlaceHolder1$txtPPBFloorno: "",
      ctl00$ContentPlaceHolder1$txtPPBPremisesBuild: "",
      ctl00$ContentPlaceHolder1$txtPPBRoad_Street: "",
      ctl00$ContentPlaceHolder1$txtPPBCityTownVill: "",
      ctl00$ContentPlaceHolder1$txtPPBTaluk: "",
      ctl00$ContentPlaceHolder1$txtPPBDistrict: "",
      ctl00$ContentPlaceHolder1$txtPPBPincode: "",
      ctl00$ContentPlaceHolder1$txtPPBOfficeEmailID: "",
      ctl00$ContentPlaceHolder1$txtMobileProp_MainPerson: mobileNumber,
      ctl00$ContentPlaceHolder1$txtMobileVeriProp_MainPerson: "",
      ctl00$lblConactNo: "",
    });

    const config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://mis.ewaybillgst.gov.in/ewb_ctz/Citizen/EnrolmentCitizen.aspx",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/png,image/svg+xml,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Content-Type": "application/x-www-form-urlencoded",
        Origin: "https://mis.ewaybillgst.gov.in",
        Connection: "keep-alive",
        Referer:
          "https://mis.ewaybillgst.gov.in/ewb_ctz/Citizen/EnrolmentCitizen.aspx",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-User": "?1",
        Priority: "u=0, i",
        Cookie: cookiefirst,
      },
      data: data,
    };

    const response = await axios(config);
    //console.log("Form submitted to send OTP:", response.data);
    const $ = cheerio.load(response.data);
    //  console.log("1cookie......", cookieString);
    const viewStaten = $("#__VIEWSTATE").val();
    const viewStateGeneratorn = $("#__VIEWSTATEGENERATOR").val();
    const eventValidationn = $("#__EVENTVALIDATION").val();
    const mytoken1 = $('input[name="ctl00$ContentPlaceHolder1$mytoken"]').val();

    const cookies = response.headers["set-cookie"] || [];
    let cookiegetsubmit = cookies
      .map((cookie) => cookie.split(";")[0])
      .join("; ");

    // console.log("cookie submit 2 ..", cookiegetsubmit);

    res.json({
      responseData: data.data,
      cookies: cookiefirst,
      viewState: viewStaten,
      viewStateGenerator: viewStateGeneratorn,
      eventValidation: eventValidationn,
      mytoken: mytoken1,
      cookiegetsubmit: cookiegetsubmit,
     
    });

  
  } catch (error) {
    // console.error("Error submitting form:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/verify-otp", async (req, res) => {
  const {
    otp,
    viewState,
    viewStateGenerator,
    eventValidation,
    mytoken,
    cookies
  } = req.body;

  try {
    // console.log("verify body ", req.body);

    const data = qs.stringify({
      __EVENTTARGET: "ctl00$ContentPlaceHolder1$Btn_Ver_otp",
      __EVENTARGUMENT: "",
      __LASTFOCUS: "",
      __VIEWSTATE: viewState,
      __VIEWSTATEGENERATOR: viewStateGenerator,
      __SCROLLPOSITIONX: "0",
      __SCROLLPOSITIONY: "289",
      __VIEWSTATEENCRYPTED: "",
      __EVENTVALIDATION: eventValidation,
      ctl00$ContentPlaceHolder1$mytoken: mytoken,
      ctl00$ContentPlaceHolder1$ddlState: "",
      ctl00$ContentPlaceHolder1$txtLegalName: "",
      ctl00$ContentPlaceHolder1$txtPanNo: "",
      ctl00$ContentPlaceHolder1$txtPPBBuildingno: "",
      ctl00$ContentPlaceHolder1$txtPPBFloorno: "",
      ctl00$ContentPlaceHolder1$txtPPBPremisesBuild: "",
      ctl00$ContentPlaceHolder1$txtPPBRoad_Street: "",
      ctl00$ContentPlaceHolder1$txtPPBCityTownVill: "",
      ctl00$ContentPlaceHolder1$txtPPBTaluk: "",
      ctl00$ContentPlaceHolder1$txtPPBDistrict: "",
      ctl00$ContentPlaceHolder1$txtPPBPincode: "",
      ctl00$ContentPlaceHolder1$txtPPBOfficeEmailID: "",
      ctl00$ContentPlaceHolder1$txtMobileVeriProp_MainPerson: otp,
      ctl00$lblConactNo: "",
    });

    const config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://mis.ewaybillgst.gov.in/ewb_ctz/Citizen/EnrolmentCitizen.aspx",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/png,image/svg+xml,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Content-Type": "application/x-www-form-urlencoded",
        Origin: "https://mis.ewaybillgst.gov.in",
        Connection: "keep-alive",
        Referer: "https://mis.ewaybillgst.gov.in/ewb_ctz/Citizen/EnrolmentCitizen.aspx",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-User": "?1",
        Priority: "u=0, i",
        Cookie: cookies,
      },
      data: data,
    };
var data1=cookies;
    const response = await axios(config);
    const $ = cheerio.load(response.data);
    const viewStaten = $("#__VIEWSTATE").val();
    const viewStateGeneratorn = $("#__VIEWSTATEGENERATOR").val();
    const eventValidationn = $("#__EVENTVALIDATION").val();
    const mytoken1 = $('input[name="ctl00$ContentPlaceHolder1$mytoken"]').val();

    const cookiesverify = response.headers["set-cookie"] || [];
    let cookiegetsubmit = cookiesverify.map((cookie) => cookie.split(";")[0]).join("; ");

    // console.log("html code ", response.data);
    const cookiesArray = data1.split("; ");
    let desiredCookies = {};

    cookiesArray.forEach((cookie) => {
      const [key, value] = cookie.split("=");
      if (
        key === "ASP.NET_SessionId" ||
        key === "__AntiXsrfToken" ||
        key === "BIGipServerMIS_Reporting_Pool"
      ) {
        desiredCookies[key] = value;
      }
    });

    let newCookiesArray = cookiegetsubmit.split("; ");
    let desiredCookies1 = {};

    newCookiesArray.forEach((cookie) => {
      const [key, value] = cookie.split("=");
      if (key === "TS019fc7a5") {
        desiredCookies1[key] = value;
      }
    });

    const objectToCookieString = (obj) =>
      Object.entries(obj)
        .map(([key, value]) => `${key}=${value}`)
        .join("; ");

    const combinedCookieString = [
      objectToCookieString(desiredCookies),
      objectToCookieString(desiredCookies1),
    ].join("; ");

    res.json({
      success: true,
      message: "OTP verified and data processed successfully.",
      data: {
        cookieverify: cookiegetsubmit,
        viewState: viewStaten,
        viewStateGenerator: viewStateGeneratorn,
        eventValidation: eventValidationn,
        mytoken: mytoken1,
        verify:data1,
        concatecookie:combinedCookieString
      }
    });
  } catch (error) {
    // console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

//generate bill 

app.post('/get_details', async (req, res) => {
  try {
      const { viewState, viewStateGenerator, eventValidation, concatecookie, mytoken } = req.body;
      // console.log("get details ", req.body);

      var data = qs.stringify({
          '__EVENTTARGET': '',
          '__EVENTARGUMENT': '',
          '__LASTFOCUS': '',
          '__VIEWSTATE': viewState,
          '__VIEWSTATEGENERATOR': viewStateGenerator,
          '__SCROLLPOSITIONX': '0',
          '__SCROLLPOSITIONY': '289',
          '__VIEWSTATEENCRYPTED': '',
          '__EVENTVALIDATION': eventValidation,
          'ctl00$ContentPlaceHolder1$mytoken': mytoken,
          'ctl00$ContentPlaceHolder1$ddlState': '27',
          'ctl00$ContentPlaceHolder1$txtLegalName': 'EKNATH',
          'ctl00$ContentPlaceHolder1$txtPanNo': '',
          'ctl00$ContentPlaceHolder1$txtPPBBuildingno': '1',
          'ctl00$ContentPlaceHolder1$txtPPBFloorno': '1',
          'ctl00$ContentPlaceHolder1$txtPPBPremisesBuild': 'ONE',
          'ctl00$ContentPlaceHolder1$txtPPBRoad_Street': 'EK',
          'ctl00$ContentPlaceHolder1$txtPPBCityTownVill': 'EKWARD',
          'ctl00$ContentPlaceHolder1$txtPPBTaluk': 'EKWARD',
          'ctl00$ContentPlaceHolder1$txtPPBDistrict': 'EKWARD',
          'ctl00$ContentPlaceHolder1$txtPPBPincode': '400001',
          'ctl00$ContentPlaceHolder1$txtPPBOfficeEmailID': '',
          'ctl00$ContentPlaceHolder1$chkVerification': 'on',
          'ctl00$ContentPlaceHolder1$btnsbmt': 'Processing...',
          'ctl00$lblConactNo': '' 
      });

      var config = {
          method: 'post',
          maxBodyLength: Infinity,
          url: 'https://mis.ewaybillgst.gov.in/ewb_ctz/Citizen/EnrolmentCitizen.aspx',
          headers: { 
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0', 
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/png,image/svg+xml,*/*;q=0.8', 
              'Accept-Language': 'en-US,en;q=0.5', 
              'Accept-Encoding': 'gzip, deflate, br, zstd', 
              'Content-Type': 'application/x-www-form-urlencoded', 
              'Origin': 'https://mis.ewaybillgst.gov.in', 
              'Connection': 'keep-alive', 
              'Referer': 'https://mis.ewaybillgst.gov.in/ewb_ctz/Citizen/EnrolmentCitizen.aspx', 
              'Upgrade-Insecure-Requests': '1', 
              'Sec-Fetch-Dest': 'document', 
              'Sec-Fetch-Mode': 'navigate', 
              'Sec-Fetch-Site': 'same-origin', 
              'Sec-Fetch-User': '?1', 
              'Priority': 'u=0, i',
              'Cookie': concatecookie
          },
          data: data
      };

      const response = await axios(config);

      const finalcookie = response.headers["set-cookie"] || [];
      let cookiedetails = finalcookie.map((cookie) => cookie.split(";")[0]).join("; ");
      // console.log("cookie details", cookiedetails);

      fs.writeFile('response.html', response.data, (err) => {
          if (err) {
              // console.error("Failed to write to file:", err);
              return res.status(500).send("Failed to write response to file.");
          } else {
              // console.log("The HTML was saved!");
              res.send({
                  message: "Data written to HTML file successfully!",
                  cookies: cookiedetails
              });
          }
      });
  } catch (error) {
      // console.error('Error:', error);
      res.status(500).send(error.message);
  }
});

// Function to extract the content between HTML tags
function extractContent(htmlcode, tagName) {
  const regex = new RegExp(`<${tagName}.*?>(.*?)<\\/${tagName}>`, 'gs');
  let matches = [];
  let match;
  while ((match = regex.exec(htmlcode)) !== null) {
    matches.push(match[1].replace(/<br\s*\/?>/gi, ' ').replace(/&amp;/g, '&').trim());
  }
  return matches;
}

const fetchAndProcessEWayBill = async (ewb_no, incr, concatecookie, machineNumber) => {
  let failure = false;
  const referer = `https://mis.ewaybillgst.gov.in/ewb_ctz/Citizen/EBPrint.aspx?encrypt=1&ewb_no=${encodeURIComponent(ewb_no)}&cal=MQ==`;

  const config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://mis.ewaybillgst.gov.in/ewb_ctz/Citizen/EwayBillPrint.aspx?ewb_no=${ewb_no}`,
      headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/png,image/svg+xml,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          'Referer': referer,
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'same-origin',
          'Sec-Fetch-User': '?1',
          'Priority': 'u=0, i',
          'Cookie': concatecookie
      }
  };

  try {
    let insertQuery = null;
    let response = null;
    let failure = false;

       response = await axios.request(config);
      const $ = cheerio.load(response.data);
      if (response.data.includes("alert('Invalid E-Way Bill No.')")) {
        insertQuery = 
        `INSERT INTO eway_bill_details (e_way_bill_no, flag, machine_number, increment_by) VALUES ($1, $2, $3, $4)`;
        values = [ewb_no, false, machineNumber, incr];
        failure=true;
      }
   else{
      const isValidResponse = $('#ctl00_ContentPlaceHolder1_lblBillNoDetails').length > 0;
    
      if (isValidResponse) {
     
          // Extract required information when the response is valid
          // console.log("isvalid response", isValidResponse);
          htmlString = $('#ctl00_ContentPlaceHolder1_GVVehicleDetails').html().toString();
          // Extract headers
          const headerHtml = htmlString.match(/<tr class="bg-purple-100">(.*?)<\/tr>/s)[1];
          const headers = extractContent(headerHtml, 'th');
       
          // Extract rows
          const rowHtmls = htmlString.match(/<tr>(.*?)<\/tr>/gs);
          const data = rowHtmls.map(rowHtml => {
            const cells = extractContent(rowHtml, 'td');
            const obj = {};
            headers.forEach((header, i) => {
              obj[header] = cells[i];
            });
            return obj;
          });
     
          const ewayBillDetails = {
              eWayBillNo: ewb_no,
              generatedDate: $('#ctl00_ContentPlaceHolder1_lblGenDateDetails').text().trim(),
              validUpto: $('#ctl00_ContentPlaceHolder1_lblValidUPtoDetails').text().trim(),
              generatedBy: $('#ctl00_ContentPlaceHolder1_lblGenDetails').text().trim(),
              mode: $('#ctl00_ContentPlaceHolder1_lblModeDetails').text().trim(),
              approxDistance: $('#ctl00_ContentPlaceHolder1_lblApxDistDetails').text().trim(),
              documentType: $('#ctl00_ContentPlaceHolder1_lblTypeDetails').text().trim(),
              documentDetails: $('#ctl00_ContentPlaceHolder1_lblDocDet').text().trim(),
              transactionType: $('#ctl00_ContentPlaceHolder1_lblTransType').text().trim(),
              fromGSTIN: $('#ctl00_ContentPlaceHolder1_txtGenBy').val().split('\n')[0].trim().split(':')[1].trim(),
              fromName: $('#ctl00_ContentPlaceHolder1_txtGenBy').val().split('\n')[1].trim(),
              fromAddress: $('#ctl00_ContentPlaceHolder1_txtGenBy').val().split('\n')[4].trim(),
              fromCity: $('#ctl00_ContentPlaceHolder1_txtGenBy').val().split('\n')[6].trim(),
              toGSTIN: $('#ctl00_ContentPlaceHolder1_txtSypplyTo').val().split('\n')[0].trim().split(':')[1].trim(),
              toName: $('#ctl00_ContentPlaceHolder1_txtSypplyTo').val().split('\n')[1].trim(),
              toAddress: $('#ctl00_ContentPlaceHolder1_txtSypplyTo').val().split('\n')[4].trim(),
              toCity: $('#ctl00_ContentPlaceHolder1_txtSypplyTo').val().split('\n')[6].trim(),
              totalTaxableAmount: $('#ctl00_ContentPlaceHolder1_lblvalue').text().trim(),
              cgstAmount: $('#ctl00_ContentPlaceHolder1_lblcgst').text().trim(),
              sgstAmount: $('#ctl00_ContentPlaceHolder1_lblsgst').text().trim(),
              igstAmount: $('#ctl00_ContentPlaceHolder1_lbligst').text().trim(),
              cessAmount: $('#ctl00_ContentPlaceHolder1_lblcess').text().trim(),
              cessNonAdvolAmount: $('#ctl00_ContentPlaceHolder1_lblCessNonAdvol').text().trim(),
              otherAmount: $('#ctl00_ContentPlaceHolder1_lblOther').text().trim(),
              totalInvoiceAmount: $('#ctl00_ContentPlaceHolder1_lblTotInvVal').text().trim(),
              vehicleMode: $('#ctl00_ContentPlaceHolder1_GVVehicleDetails').find('tr').eq(1).find('td').eq(0).text().trim(),
              vehicleNo: $('#ctl00_ContentPlaceHolder1_GVVehicleDetails').find('tr').eq(1).find('td').eq(1).text().trim(),
              fromLocation: $('#ctl00_ContentPlaceHolder1_GVVehicleDetails').find('tr').eq(1).find('td').eq(2).text().trim(),
              entryDate: $('#ctl00_ContentPlaceHolder1_GVVehicleDetails').find('tr').eq(1).find('td').eq(3).text().trim(),
              enteredBy: $('#ctl00_ContentPlaceHolder1_GVVehicleDetails').find('tr').eq(1).find('td').eq(4).text().trim(),
              cewbNo: $('#ctl00_ContentPlaceHolder1_GVVehicleDetails').find('tr').eq(1).find('td').eq(5).text().trim(),
              vehicle_details: JSON.stringify(data)
          };

          console.log("ewayBillDetails", ewayBillDetails);

          insertQuery = 
          `INSERT INTO eway_bill_details (
              e_way_bill_no, generated_date, valid_upto, generated_by, mode, approx_distance,
              document_type, document_details, transaction_type, from_gstin, from_name, from_address,
              from_city, to_gstin, to_name, to_address, to_city, total_taxable_amount, cgst_amount,
              sgst_amount, igst_amount, cess_amount, cess_non_advol_amount, other_amount,
              total_invoice_amount, vehicle_details, flag, machine_number, increment_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)`;

          values = [
              ewayBillDetails.eWayBillNo, ewayBillDetails.generatedDate, ewayBillDetails.validUpto,
              ewayBillDetails.generatedBy, ewayBillDetails.mode, ewayBillDetails.approxDistance,
              ewayBillDetails.documentType, ewayBillDetails.documentDetails, ewayBillDetails.transactionType,
              ewayBillDetails.fromGSTIN, ewayBillDetails.fromName, ewayBillDetails.fromAddress,
              ewayBillDetails.fromCity, ewayBillDetails.toGSTIN, ewayBillDetails.toName, ewayBillDetails.toAddress,
              ewayBillDetails.toCity, ewayBillDetails.totalTaxableAmount, ewayBillDetails.cgstAmount,
              ewayBillDetails.sgstAmount, ewayBillDetails.igstAmount, ewayBillDetails.cessAmount,
              ewayBillDetails.cessNonAdvolAmount, ewayBillDetails.otherAmount, ewayBillDetails.totalInvoiceAmount,
              ewayBillDetails.vehicle_details, true, machineNumber, incr
          ];
      }
      else{
        return {success:false, msg:`Not a valid response`}; 
      }
    }

      // await pool.query(insertQuery, values);
      queryresponse = await pool.query(insertQuery, values)
      .then(result => {
      // console.log('Insert successful', ewb_no);
      return 'Insert successful';
      })
      .catch(error => {
      // console.error('Error inserting data:', error);
      // sendFailureEmail(`Error while inserting data in the database: ${error.toString()}`);
      return 'Error while inserting data in the database'; 
     });
     console.log("Query Response", queryresponse);
     return {success:true, message:"Success",failure: failure, queryresponse};
  } catch (error) {
      // console.error('Error fetching the E-Way Bill:', error);
      // sendFailureEmail(`Server Error Error in fetching E-way bill details: ${error.toString()}`);
      return {success:false, message:"server error", failure: failure, queryresponse};
  }
};

app.get('/fetch-eway-bill', async (req, res) => {
  const increments = [13, 3, 12, 2, 1, 5];
  const concatecookie = req.query.concatecookie; 
  const machineNumber = req.query.machineNumber; 
  const email = req.query.email;
  const ewb_no = req.query.ewayBillNumber;
  first = BigInt(ewb_no);

 
  for (let i=0;i<increments.length;i++) {
      
    while (true) {
      second=first+BigInt(increments[i])
      console.log("value of increment is ", increments[i]); 
      let response = await fetchAndProcessEWayBill(second.toString(), BigInt(increments[i]), concatecookie, machineNumber);
      console.log("fetchand process api error", response);

      const {success, message, failure:failure, queryresponse}= response;
 
      if (success && !failure) {
        i=0;
        first=second;
        second = second + BigInt(increments[i]);
        continue;
    }else{
        break;
      }
  }
}
    await sendSuccessEmail(email);
  
  // await sendSucessEmail();

  res.send(`Processing complete. Final EWB NO: ${ewb_no}`);

  if (email) {
    await sendSuccessEmail(email);
  }
});

// API endpoint to get the last row for machine_number
app.get('/last-row-machine', async (req, res) => {
  const machineNumber = req.query.machineNumber; 
  // console.log("machineNumber", machineNumber);

  try {
    const result = await pool.query(`
      SELECT *
      FROM eway_bill_details
      WHERE machine_number = $1 AND flag = true
      ORDER BY id DESC
      LIMIT 1;
    `, [machineNumber]); 
    
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'No data found' });
    }
  } catch (error) {
    console.error('Error executing query', error.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});