import { act } from '@testing-library/react';

export async function unmountComponent(): Promise<void> {
	const container = document.getElementById('root');
	if (!container) return;

	await act(() => {
		container.innerHTML = '';
		delete container.dataset.formSubmitted;
		delete container.dataset.communityName;
		delete container.dataset.lastValidationError;
	});
}
