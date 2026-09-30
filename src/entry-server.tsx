import { createHandler, StartServer } from "@solidjs/start/server";

const handler = createHandler(
  () => (
    <StartServer
      document={(props) => (
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
            {props.assets}
          </head>
          <body>
            <div id="app">{props.children}</div>
            {props.scripts}
          </body>
        </html>
      )}
    />
  ),
  { mode: "async" },
);

export default handler;
