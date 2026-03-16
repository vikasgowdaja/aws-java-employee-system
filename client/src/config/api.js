const normalizeBaseUrl = (value) => {
	if (!value || typeof value !== 'string') {
		return '';
	}

	return value.trim().replace(/\/+$/, '');
};

const envBaseUrl = normalizeBaseUrl(process.env.REACT_APP_API_BASE_URL);
const localDevFallback =
	typeof window !== 'undefined' && window.location.hostname === 'localhost'
		? 'http://localhost:8080/api'
		: '/api';

const API_BASE_URL = envBaseUrl || localDevFallback;

export default API_BASE_URL;