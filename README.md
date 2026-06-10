# manage_slack_invite

The StarRocks Slack subscription level is Pro. Every 400 invites or 30 days the Slack invite URL needs updating. We need a page with a static URL that redirects to the new link, and a way to manage this. It would also be nice to be able to collect extra information from the person signing up like where they work.

This code uses Puppeteer to check Slack invite links.
