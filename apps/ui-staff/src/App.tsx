import { Route, Routes } from 'react-router-dom';
import { Root } from '@ocom/ui-staff-route-root';
import './App.css';

export default function App() {
	const rootSection = <Root />;

	return (
		<Routes>
			<Route path="*" element={rootSection} />
			<Route path="/staff/*" element={rootSection} />
		</Routes>
	);
}
