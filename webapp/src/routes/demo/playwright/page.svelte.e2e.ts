import { expect, test } from '@playwright/test';

test('scan, edit and download vcf', async ({ page }) => {
	// Popups after async fetch are often blocked; stub so the UI uses the second-tap + download path.
	await page.addInitScript(() => {
		window.open = () => null;
	});

	await page.route('/api/scan', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				scanJobId: 1,
				contact: {
					firstName: 'Max',
					lastName: 'Mustermann',
					company: 'Example GmbH',
					title: 'Sales Manager',
					emails: ['max@example.com'],
					phones: ['+491701234567'],
					website: 'https://example.com',
					address: 'Street 1',
					notes: 'OCR raw text'
				}
			})
		});
	});

	await page.route('/api/vcf', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'text/vcard',
			headers: { 'Content-Disposition': 'attachment; filename="max.vcf"' },
			body: 'BEGIN:VCARD\r\nVERSION:3.0\r\nFN:Max Mustermann\r\nEND:VCARD\r\n'
		});
	});

	await page.goto('/');
	await expect(page.locator('h1')).toContainText('Scan2Contact');

	const pngBuffer = Buffer.from(
		'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y5hAFYAAAAASUVORK5CYII=',
		'base64'
	);

	await page.setInputFiles('input[type="file"]', {
		name: 'card.png',
		mimeType: 'image/png',
		buffer: pngBuffer
	});

	await page.getByRole('button', { name: 'Scan card' }).click();
	await expect(page.getByLabel('First name')).toHaveValue('Max');
	await expect(page.getByLabel('Last name')).toHaveValue('Mustermann');

	await page.getByLabel('Company').fill('Changed Corp');

	await page.getByRole('button', { name: 'Add to contacts' }).click();
	await expect(page.getByRole('button', { name: 'Open in Contacts' })).toBeVisible();

	const downloadPromise = page.waitForEvent('download');
	await page.getByRole('button', { name: 'Open in Contacts' }).click();
	const download = await downloadPromise;
	expect(download.suggestedFilename()).toContain('.vcf');
});
