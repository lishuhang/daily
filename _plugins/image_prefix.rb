# frozen_string_literal: true

# ImagePrefix plugin for lishuhang.me (v1.11)
# Uses hooks instead of Generator for earlier execution.

module Jekyll
  module ImagePrefix
    def self.config(site)
      @prefixes_cache ||= {}
      @prefixes_cache[site.object_id] ||= begin
        prefixes = site.config['image_prefixes'] || []
        if prefixes.empty?
          prefixes = [{ 'range' => [nil, nil], 'prefix' => site.config['url'] || '' }]
        end
        prefixes
      end
    end

    def self.pick_prefix(site, date_str)
      config(site).each do |entry|
        range = entry['range'] || [nil, nil]
        lower, upper = range[0], range[1]
        next if lower && date_str < lower
        next if upper && date_str >= upper
        return entry['prefix'].to_s
      end
      config(site).last && config(site).last['prefix'].to_s
    end

    def self.rewrite(post, site)
      date_str = post.date.strftime('%Y-%m')
      prefix = pick_prefix(site, date_str)
      return if prefix.nil? || prefix.empty?

      prefix_clean = prefix.chomp('/')

      # Rewrite front matter 'image' field
      if post.data['image'].is_a?(String) && post.data['image'] =~ %r{\A/\d{4}/}
        post.data['image'] = prefix_clean + post.data['image']
      end

      # Rewrite content
      content = post.content

      # Markdown: ![alt](/YYYY/...)
      content = content.gsub(%r{(!\[[^\]]*\]\()/(\d{4}/[^\)]+)\)}) do
        md = Regexp.last_match
        "#{md[1]}#{prefix_clean}/#{md[2]})"
      end

      # HTML: src="/YYYY/..."
      content = content.gsub(%r{(src=["'])/(\d{4}/[^"']+)["']}) do
        md = Regexp.last_match
        quote = md[1][-1, 1]
        "#{md[1]}#{prefix_clean}/#{md[2]}#{quote}"
      end

      post.content = content
    end
  end
end

# Hook: runs after post is initialized, before rendering
Jekyll::Hooks.register :posts, :pre_render do |post, payload|
  Jekyll::ImagePrefix.rewrite(post, post.site)
  # Also update the payload (used by Liquid templates)
  if post.data['image'].is_a?(String) && post.data['image'] =~ %r{\Ahttps?://}
    payload['page']['image'] = post.data['image'] if payload['page']
  end
end

# Also log at startup
Jekyll::Hooks.register :site, :after_init do |site|
  prefixes = Jekyll::ImagePrefix.config(site)
  Jekyll.logger.info 'ImagePrefix:', "Loaded with #{prefixes.size} prefix ranges"
end
