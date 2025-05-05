<a name="readme-top"></a>
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![LinkedIn][linkedin-shield]][linkedin-url]

<h3 align="center">ga4-reporter</h3>

  <p align="center">
    A lightweight Express.js API for retrieving pageview data from Google Analytics 4 properties, initially designed for use with <a href="https://github.com/glanceapp/glance">Glance</a>.
    <br />
    <br />
    <a href="https://github.com/ssyyhhrr/ga4-reporter/issues">Report Bug</a>
    ·
    <a href="https://github.com/ssyyhhrr/ga4-reporter/issues">Request Feature</a>
  </p>
</div>



<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
    </li>
    <li><a href="#prerequisites">Prerequisites</a></li>
    <li><a href="#installation">Installation</a></li>
    <li><a href="#setting-up-google-analytics-service-account">Setting up Google Analytics Service Account</a></li>
    <li><a href="#environment-configuration">Environment Configuration</a></li>
    <li><a href="#api-endpoints">API Endpoints</a></li>
    <li><a href="#finding-your-ga4-property-id">Finding Your GA4 Property ID</a></li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#deployment-considerations">Deployment Considerations</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#troubleshooting">Troubleshooting</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

<ul>
    <li>Fetch pageviews data for a single GA4 property</li>
    <li>Fetch pageviews data for multiple GA4 properties in one request</li>
    <li>Supports both GET and POST requests</li>
    <li>Returns formatted pageview counts with property names</li>
    <li>Simple, RESTful API endpoints</li>
</ul>

## Prerequisites
<ul>
    <li>Node.js (v14 or higher)</li>
    <li>npm or yarn</li>
    <li>Google Analytics 4 property(s)</li>
    <li>Google Cloud service account with appropriate permissions</li>
</ul>

## Installation
1. Clone this repository:
```
git clone https://github.com/yourusername/ga4-pageviews-api.git
cd ga4-pageviews-api
```

2. Install dependencies:
```
npm install
```

3. Setup Google Analytics service account (see below)

4. Create a `.env` file (see below)

5. Start the server:
```
npm start
```

## Setting up Google Analytics Service Account

### Step 1: Create and Download the Service Account Key
1. From the service accounts list in your <a href="https://console.cloud.google.com/">Google Cloud</a> project, select your service account.
2. Go to the **Keys** tab
3. Click **Add Key** > **Create new key**
4. Select **JSON** as the key type and click **Create**
5. Move the key file to the project directory

### Step 2: Grant Access to Your GA4 Properties
1. Go to your <a href="https://analytics.google.com/">Google Analytics</a> account
2. Navigate to Admin > Property > Property Access Management
3. Click the **+** button to add a user
4. Enter the email address of your service account (found in the service account details in Google Cloud Console)
5. Select the role **Viewer**
6. Click **Add**
7. Repeat this process for each GA4 property you want to access

## Environment Configuration
Create a `.env` file in the root directory with the following variables
```
PORT=3000
GOOGLE_APPLICATION_CREDENTIALS=service-account-key.json # Name of your service account key
```

## API Endpoints

### Health Check
```
GET /healthcheck
```
Returns a simple status check to verify the API is running.

### Single Property Pageviews (GET)
```
GET /api/pageviews/:propertyid
```
Returns pageviews for a single GA4 property.

Example Response:
```json
{
  "pageviews": 12345
}
```

### Multiple Properties Pageviews (GET)
```
GET /api/pageviews?ids=123456789,987654321
```
Returns pageviews for multiple GA4 properties using comma-separated IDs.

Example Response:
```json
{
  "properties": [
    {
      "propertyId": "123456789",
      "propertyName": "My Website",
      "pageviews": 12345,
      "pageviewsFormatted": "12,345"
    },
    {
      "propertyId": "987654321",
      "propertyName": "My Other Website",
      "pageviews": 67890,
      "pageviewsFormatted": "67,890"
    }
  ],
  "total": 80235
}
```

### Multiple Properties Pageviews (POST)

```
POST /api/pageviews
```
Body:
```json
{
  "propertyIds": ["123456789", "987654321"]
}
```

Returns the same format as the GET endpoint for multiple properties.

## Finding Your GA4 Property ID
1. Go to your <a href="https://analytics.google.com/">Google Analytics</a> account
2. Select the property you want to use
3. Go to **Admin** > **Property** Settings
4. The Property ID is displayed at the top (format: "123456789")

<!-- USAGE EXAMPLES -->
## Usage

### Using cURL
```bash
# Get pageviews for a single property
curl http://localhost:3000/api/pageviews/123456789

# Get pageviews for multiple properties
curl http://localhost:3000/api/pageviews?ids=123456789,987654321

# POST request for multiple properties
curl -X POST http://localhost:3000/api/pageviews \
  -H "Content-Type: application/json" \
  -d '{"propertyIds": ["123456789", "987654321"]}'
```

### Using JavaScript/Fetch
```js
// Get pageviews for multiple properties
fetch('http://localhost:3000/api/pageviews?ids=123456789,987654321')
  .then(response => response.json())
  .then(data => console.log(data));

// POST request for multiple properties
fetch('http://localhost:3000/api/pageviews', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    propertyIds: ['123456789', '987654321']
  }),
})
.then(response => response.json())
.then(data => console.log(data));
```

## Deployment Considerations
1. Ensure your service account key is securely stored
2. Implement rate limiting if exposing the API publicly
3. Consider adding authentication if the API will be accessed by multiple clients

## Contributing
If you have a suggestion that would make this project better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement". Don't forget to give the project a star! Thanks again!
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

## Troubleshooting

### Common Issues
1. **Authentication errors:** Ensure your service account has been properly granted access to the GA4 properties and the key file is correctly referenced in your .env file.
2. **No data returned:** Check that your property IDs are correct and that there is data for the time period (the API fetches data from yesterday to today).
3. **"Property not found"** errors: Verify that the property ID is correct and that your service account has access to it.
4. **API rate limiting:** The Google Analytics Data API has quotas. If you're making many requests, you might hit these limits.

<!-- CONTACT -->
## Contact

Rhys Bishop - [https://sy.hr/](https://sy.hr/) - mail@rhysbi.shop

Project Link: [https://github.com/ssyyhhrr/ga4-reporter](https://github.com/ssyyhhrr/ga4-reporter)

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/ssyyhhrr/ga4-reporter.svg?style=for-the-badge
[contributors-url]: https://github.com/ssyyhhrr/ga4-reporter/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/ssyyhhrr/ga4-reporter.svg?style=for-the-badge
[forks-url]: https://github.com/ssyyhhrr/ga4-reporter/network/members
[stars-shield]: https://img.shields.io/github/stars/ssyyhhrr/ga4-reporter.svg?style=for-the-badge
[stars-url]: https://github.com/ssyyhhrr/ga4-reporter.svg/stargazers
[issues-shield]: https://img.shields.io/github/issues/ssyyhhrr/ga4-reporter.svg?style=for-the-badge
[issues-url]: https://github.com/ssyyhhrr/ga4-reporter/issues
[license-shield]: https://img.shields.io/github/license/ssyyhhrr/ga4-reporter.svg?style=for-the-badge
[license-url]: https://github.com/ssyyhhrr/ga4-reporter/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://www.linkedin.com/in/rhys-bishop-158638214/
