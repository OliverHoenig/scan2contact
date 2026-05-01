/** Default rows inserted when a user has no mail templates yet (server). Also used as client fallback when not signed in. */
export const DEFAULT_MAIL_TEMPLATES_SEED = [
	{
		displayName: 'Stay in touch',
		subject: 'Nice to meet you',
		body: 'Hi {firstName},\n\nIt was great meeting you. I would love to stay in touch.\n\nBest regards,'
	},
	{
		displayName: 'Thank you',
		subject: 'Thank you',
		body: 'Hi {firstName},\n\nThank you for your time today. I enjoyed our conversation.\n\nBest regards,'
	},
	{
		displayName: 'Follow up',
		subject: 'Following up',
		body: 'Hi {firstName},\n\nFollowing up on our conversation — let me know if you would like to connect again.\n\nBest regards,'
	},
	{
		displayName: 'Connect on LinkedIn',
		subject: 'Connection request',
		body: 'Hi {firstName},\n\nIt was great meeting you. I would like to connect here on LinkedIn as well.\n\nBest regards,'
	}
] as const;
