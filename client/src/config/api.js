const normalizeBaseUrl = (value) => {
	if (!value || typeof value !== 'string') {
		return '';
	}
	return value.trim().replace(/\/+$/, '');
};

// Determine API base URL with proper fallback logic
const getApiBaseUrl = () => {
	// First priority: explicit environment variable (set during Docker build)
	const envBaseUrl = normalizeBaseUrl(process.env.REACT_APP_API_BASE_URL);
	if (envBaseUrl) {
		console.log('[API Config] Using REACT_APP_API_BASE_URL:', envBaseUrl);
		return envBaseUrl;
	}

	// Default: use relative path for Nginx reverse proxy
	// This works for both localhost and EC2 IP-based access (http://13.60.93.239:3000)
	console.log('[API Config] Using relative path proxy: /api');
	return '/api';
};

const API_BASE_URL = getApiBaseUrl();

export default API_BASE_URL;