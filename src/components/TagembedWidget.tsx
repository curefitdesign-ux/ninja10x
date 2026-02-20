import { useEffect } from "react";

const TagembedWidget = () => {
  useEffect(() => {
    // Remove old script if widget-id changed
    const existing = document.querySelector('script[src="https://widget.tagembed.com/embed.min.js"]');
    if (existing) existing.remove();

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
      data-widget-id="317526"
      data-website="1"
    />
  );
};

export default TagembedWidget;

