export function createReq(method, body = {}, cookie = '') {
  return { method, body, headers: { cookie } };
}

export function createRes() {
  const res = { statusCode: 0, headers: {}, body: null };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (obj) => {
    res.body = obj;
  };
  res.setHeader = (k, v) => {
    res.headers[k.toLowerCase()] = v;
  };
  res.end = () => {};
  return res;
}
