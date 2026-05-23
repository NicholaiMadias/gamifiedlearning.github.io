# gamifiedlearning.github.io

Mobile-friendly educational games and interactive experiences.

## Deployment

- Primary workflow: `.github/workflows/dual-deploy.yml`
- GitHub Pages custom domain: `nicholai.org` (must match `CNAME`)
- The workflow validates the `CNAME` value before deployment

## Development

- Install dependencies: `npm ci`
- Run tests: `npm test`
