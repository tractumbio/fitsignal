# Deploy FitSignal's AI backend to GCP Cloud Run

The prototype's "Analyze" button currently calls an in-preview AI helper that
only works inside this design tool. To run for real on the internet, deploy
this tiny backend, then point the front end at it.

## 1. Get an OpenAI API key
Create one at https://platform.openai.com/.

## 2. Deploy to Cloud Run
```
cd deploy
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

gcloud run deploy fitsignal-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars OPENAI_API_KEY=YOUR_KEY_HERE
```
(Prefer Secret Manager over a plain env var for the real key in production:
`--set-secrets OPENAI_API_KEY=fitsignal-key:latest`.)

Cloud Run prints a service URL like `https://fitsignal-backend-xxxx.a.run.app`.

## 3. Point the front end at it
In FitSignal.dc.html's `runAI`, replace the `window.claude.complete(...)` call
with a fetch to your deployed endpoint:

```js
runAI = async () => {
  const res = await fetch('https://YOUR-SERVICE-URL/api/analyze', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ resumeText: this.state.resumeText }),
  });
  if (!res.ok) throw new Error('analyze failed');
  return res.json();
};
```

## 4. Host the front end
Export FitSignal.dc.html as a standalone file and upload it to a Cloud
Storage bucket (static website hosting) or Firebase Hosting. It's plain
HTML/JS — no build step needed.
