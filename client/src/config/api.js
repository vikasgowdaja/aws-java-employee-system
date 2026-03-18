const normalizeBaseUrl = (value) => {
	if (!value || typeof value !== 'string') {
		return '';
	}
	return value.trim().replace(/\/+$/, '');
};

// Determine API base URL with proper fallback logic
const getApiBaseUrl = () => {
	// First priority: explicit environment variable
	const envBaseUrl = normalizeBaseUrl(process.env.REACT_APP_API_BASE_URL);
	if (envBaseUrl) {
		console.log('[API Config] Using REACT_APP_API_BASE_URL:', envBaseUrl);
		return envBaseUrl;
	}

	// Second priority: localhost development fallback
	if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
		const localFallback = 'http://localhost:8080/api';
		console.log('[API Config] Localhost detected, using fallback:', localFallback);
		return localFallback;
	}

	// Third priority: relative path (proxied through Nginx in production)
	console.log('[API Config] Using relative path proxy: /api');
	return '/api';
};

const API_BASE_URL = getApiBaseUrl();

export default API_BASE_URL;