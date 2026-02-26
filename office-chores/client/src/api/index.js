async function req(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// Members
export const getMembers = () => req('GET', '/api/members');
export const addMember = (name) => req('POST', '/api/members', { name });
export const deleteMember = (id) => req('DELETE', `/api/members/${id}`);

// Chores
export const getChoreEvents = (start, end) =>
  req('GET', `/api/chores?start=${start}&end=${end}`);
export const getChore = (id) => req('GET', `/api/chores/${id}`);
export const createChore = (chore) => req('POST', '/api/chores', chore);
export const updateChore = (id, chore) => req('PUT', `/api/chores/${id}`, chore);
export const deleteChore = (id) => req('DELETE', `/api/chores/${id}`);

// Completions
export const markComplete = (choreId, occurrenceDate, completedBy, notes) =>
  req('POST', '/api/completions', { choreId, occurrenceDate, completedBy, notes });
export const unmarkComplete = (choreId, occurrenceDate) =>
  req('DELETE', '/api/completions', { choreId, occurrenceDate });
export const getHistory = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return req('GET', `/api/completions/history${qs ? '?' + qs : ''}`);
};
