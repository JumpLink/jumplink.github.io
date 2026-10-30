// Static preview server for `_site`: `gjs -m build/preview.mjs [dir] [port]`.
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Soup from 'gi://Soup?version=3.0';

const [dir = '_site', port = '8080'] = ARGV;
const root = Gio.File.new_for_path(dir);
const types = {
    html: 'text/html; charset=utf-8',
    css: 'text/css',
    js: 'text/javascript',
    json: 'application/json',
    xml: 'application/xml',
    txt: 'text/plain',
    svg: 'image/svg+xml',
    png: 'image/png',
    jpg: 'image/jpeg',
    webp: 'image/webp',
    woff2: 'font/woff2',
};

const server = new Soup.Server();
server.add_handler('/', (_server, message, path) => {
    let rel = decodeURIComponent(path).replace(/^\/+/, '');
    if (rel.split('/').includes('..')) return message.set_status(403, null);
    let file = root.resolve_relative_path(rel);
    if (file.query_file_type(Gio.FileQueryInfoFlags.NONE, null) === Gio.FileType.DIRECTORY)
        file = file.get_child('index.html');
    try {
        const [, bytes] = file.load_contents(null);
        const ext = file.get_basename().split('.').pop();
        message.set_status(200, null);
        message.get_response_headers().append('Content-Type', types[ext] ?? 'application/octet-stream');
        message.get_response_body().append(bytes);
    } catch {
        message.set_status(404, null);
    }
});
server.listen_local(Number(port), Soup.ServerListenOptions.IPV4_ONLY);
print(`http://127.0.0.1:${port}/ → ${dir}`);
GLib.MainLoop.new(null, false).run();
