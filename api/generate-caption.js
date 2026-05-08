export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { channel, bullets } = req.body;

  if (!channel || !bullets) {
    return res.status(400).json({ error: 'Missing channel or bullets' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const guidelines = {
    jim_icg: `You are writing a caption for @JIM_ICG - the main JIM channel.
Tone: Warm, welcoming, official but not stiff
Length: Medium (3-6 lines)
Content: Events, announcements, sermon clips, general community life
Closing: Call-to-action + Link-in-bio mention
Target: Existing members + interested people from Munich
Style: Authentic, not corporate. No excessive emoji. No Christian jargon.`,

    jimworship: `You are writing a caption for @jimworship - the Worship Band channel.
Tone: Devotional, quiet, spiritually deep - invites people to pause and listen
Length: Short to medium (2-4 lines) - less is more
Content: Worship videos, live recordings, new songs, reels
Closing: No harsh CTA - rather a quiet Bible verse quote or invitation to stillness/worship, then Link-in-bio
Target: Worship community, spiritually seekers
Style: Authentic, no excessive emoji.`,

    jim_ketawa: `You are writing a caption for @jim_ketawa - the Fun & Light Content channel.
Tone: Casual, humorous, authentic - can be funny, stays welcoming to the community
Length: Short & punchy (1-3 lines), sometimes just one sentence + emojis
Content: Skits, memes, relatable community humor, casual reels
Closing: Playful CTA or question to the audience
Target: Younger generation, people who don't know JIM yet
Style: Authentic. Emojis allowed here. No Christian jargon.`,

    youtube: `You are writing a caption for YouTube (JIM channel).
Tone: Welcoming, professional, slightly more detailed than Instagram
Length: Detailed (6-10 lines) - YouTube descriptions can be longer
Content: Sermons, worship sessions, events
Closing: CTA (Subscribe/Like) + Links
Target: Broad audience, also outside Munich
Style: Professional yet warm. No excessive emoji.`,
  };

  const selectedGuideline = guidelines[channel] || guidelines.jim_icg;

  const systemPrompt = `You are the Social Media Caption Writer for JIM (Jemaat Indonesia München), an Indonesian-rooted church community in Munich. You write captions for 4 channels, each with its own tone, length, and audience.

LANGUAGES:
- Standard: English and Indonesian
- English = for broader reach and international members
- Indonesian = for the core community
- Always provide BOTH versions unless otherwise specified

CHANNEL GUIDELINES:
${selectedGuideline}

IMPORTANT STYLE RULES:
- No excessive emoji usage (except @jim_ketawa where emojis are encouraged)
- No Christian jargon that isn't understandable
- Authentic, not corporate
- Vary CTAs - don't always use the same message
- Keep language simple and inviting
- Write for the target audience specifically`;

  const userMessage = `Here are the bullet points for the caption:
${bullets}

Please generate:
1. An English caption following the guidelines
2. An Indonesian caption following the guidelines
3. 2-3 hashtag suggestions for each language

Format your response EXACTLY like this:

ENGLISH:
[Caption here]

INDONESIAN:
[Caption here]

HASHTAGS ENGLISH:
[Hashtags here]

HASHTAGS INDONESIAN:
[Hashtags here]`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        model: 'claude-opus-4-1-20250805',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: userMessage,
          },
        ],
        system: systemPrompt,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Anthropic API error:', error);
      return res.status(500).json({ error: 'Failed to generate caption' });
    }

    const data = await response.json();
    const text = data.content[0].text;

    // Parse the response
    const englishMatch = text.match(/ENGLISH:\n([\s\S]*?)(?=\n\nINDONESIAN:|INDONESIAN:)/);
    const indonesianMatch = text.match(/INDONESIAN:\n([\s\S]*?)(?=\n\nHASHTAGS ENGLISH:|HASHTAGS ENGLISH:)/);
    const hashtagsENMatch = text.match(/HASHTAGS ENGLISH:\n([\s\S]*?)(?=\n\nHASHTAGS INDONESIAN:|HASHTAGS INDONESIAN:)/);
    const hashtagsIDMatch = text.match(/HASHTAGS INDONESIAN:\n([\s\S]*?)$/);

    const captionEN = englishMatch ? englishMatch[1].trim() : 'Error parsing English caption';
    const captionID = indonesianMatch ? indonesianMatch[1].trim() : 'Error parsing Indonesian caption';
    const hashtagsEN = hashtagsENMatch ? hashtagsENMatch[1].trim() : '';
    const hashtagsID = hashtagsIDMatch ? hashtagsIDMatch[1].trim() : '';

    const hashtags = `${hashtagsEN}\n\n${hashtagsID}`.trim();

    return res.status(200).json({
      captionEN,
      captionID,
      hashtags,
    });
  } catch (error) {
    console.error('Error generating caption:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
