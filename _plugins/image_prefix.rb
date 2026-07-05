# frozen_string_literal: true

# ImagePrefix Generator for lishuhang.me (v1.11)
#
# Rewrites relative image paths (/<year>/<month>/...) in post content to full URLs
# based on post date and site.image_prefixes config.
#
# Posts store image URLs as: /YYYY/MM/DD/slug/NN.ext  (or /YYYY/MM/MMDD-d.ext for daily)
# At build time, this plugin combines: prefix + path → full URL
#
# Config format in _config.yml:
#   image_prefixes:
#     - range: [null, "2026-07"]        # before 2026-08
#       prefix: "https://lishuhang.me/img/"
#     - range: ["2026-08", null]        # 2026-08 onwards
#       prefix: "https://lishuhang.me/img/"  # (change to img2/ or R2 URL when migrating)
#
# Example:
#   Post has: image: /2025/10/07/slug/01.jpg
#   Config prefix: "https://lishuhang.me/img/"
#   Result: https://lishuhang.me/img/2025/10/07/slug/01.jpg

module Jekyll
  class ImagePrefixGenerator < Generator
    safe true
    priority :low

    def generate(site)
      @prefixes = site.config['image_prefixes'] || []
      if @prefixes.empty?
        @prefixes = [{ 'range' => [nil, nil], 'prefix' => site.config['url'] || '' }]
      end

      site.posts.docs.each do |post|
        rewrite_post(post)
      end
      Jekyll.logger.info 'ImagePrefix:', "Processed #{site.posts.docs.size} posts with #{@prefixes.size} prefix ranges"
    end

    def rewrite_post(post)
      date_str = post.date.strftime('%Y-%m')
      prefix = pick_prefix(date_str)
      return if prefix.nil? || prefix.empty?

      prefix_clean = prefix.to_s.chomp('/')

      # Rewrite front matter 'image' field
      if post.data['image'].is_a?(String) && post.data['image'] =~ %r{^/\d{4}/}
        post.data['image'] = prefix_clean + post.data['image']
      end

      # Rewrite image URLs in content
      content = post.content

      # Markdown image: ![alt](/YYYY/...)
      content = content.gsub(%r{(!\[[^\]]*\]\()/(\d{4}/[^\)]+)\)}) do
        "#{Regexp.last_match(1)}#{prefix_clean}/#{Regexp.last_match(2)})"
      end

      # HTML img src="/YYYY/..." or src='/YYYY/...'
      content = content.gsub(/(src=["\'])/(\d{4}/[^\1"\']+)\1/) do
        m = Regexp.last_match
        "#{m[1]}#{prefix_clean}/#{m[2]}#{m[1]}"
      end

      post.content = content
    end

    def pick_prefix(date_str)
      @prefixes.each do |entry|
        range = entry['range'] || [nil, nil]
        lower, upper = range[0], range[1]
        next if lower && date_str < lower
        next if upper && date_str >= upper
        return entry['prefix'].to_s
      end
      @prefixes.last && @prefixes.last['prefix'].to_s
    end
  end
end
