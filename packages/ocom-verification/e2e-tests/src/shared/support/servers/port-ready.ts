import net from 'node:net';

interface WaitForPortOptions {
	timeoutMs?: number;
	intervalMs?: number;
}

export function isPortListening(port: number): Promise<boolean> {
	return new Promise((resolve) => {
		const socket = net.createConnection({ port, host: '127.0.0.1' });
		socket.once('connect', () => {
			socket.destroy();
			resolve(true);
		});
		socket.once('error', () => {
			socket.destroy();
			resolve(false);
		});
	});
}

export async function waitForPort(port: number, { timeoutMs = 30_000, intervalMs = 250 }: WaitForPortOptions = {}): Promise<boolean> {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		if (await isPortListening(port)) return true;
		await new Promise((resolve) => setTimeout(resolve, intervalMs));
	}
	return false;
}
