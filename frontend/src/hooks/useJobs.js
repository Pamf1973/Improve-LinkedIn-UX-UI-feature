import { useState, useCallback } from 'react';
import { fetchJobs } from '../api/jobsApi';

export function useJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadJobs = useCallback(async ({ query = '', categories = [], skills = [], filters = {} } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJobs({ query, categories, skills, filters });
      setJobs(data.jobs || []);
      return data;
    } catch (e) {
      setError(e);
      setJobs([]);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { jobs, setJobs, loading, error, loadJobs };
}
