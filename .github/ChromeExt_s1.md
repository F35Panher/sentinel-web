Great. We'll use TypeScript + Chrome Manifest V3 + Vite and build the extension incrementally, starting with a working installable shell.

I can help you implement the project files and review the code here. To begin, let's establish this structure:

text
```
sentinel-web/
├── public/
│   └── icons/
├── src/
│   ├── background/
│   │   └── service-worker.ts
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.ts
│   │   └── popup.css
│   └── shared/
│       └── types.ts
├── tests/
├── manifest.json
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### First milestone

- Build the extension with TypeScript.
- Load it into Chrome through `chrome://extensions`.
- Display a popup with protection status.
- Save a setting locally using Chrome Storage.
- Add a build command and automated tests.
- Request only the permissions needed for these features.

We'll keep the initial shell independent of any server. Tracker blocking and local threat-intelligence matching will come next.

One question: are you using Windows, macOS, or Linux for development? I can tailor the setup and Chrome installation instructions to your environment.