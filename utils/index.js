export const output = (res) => ({
  ok: true,
  result: res,
});

export const error = (code, msg, data) => ({
  ok: false,
  code,
  msg,
  data,
});
