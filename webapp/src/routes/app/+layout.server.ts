import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(303, '/auth/login');
	}
	return {
		user: {
			email: locals.user.email,
			name: locals.user.name
		}
	};
};
