import { useEffect } from "react";

const TagembedWidget = () => {
  useEffect(() => {
    // Only inject the script once
    if (document.querySelector('script[src="https://widget.tagembed.com/embed.min.js"]')) return;
    const script = document.createElement("script");
    script.src = "https://widget.tagembed.com/embed.min.js";
    script.type = "text/javascript";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div
      className="tagembed-widget"
      style={{ width: "100%", height: "100%", minHeight: "500px", overflow: "auto" }}
      data-widget-id="316751"
      data-website="1"
    />
  );
};

export default TagembedWidget;
