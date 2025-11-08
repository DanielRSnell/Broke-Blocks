# Block Settings Configuration

Control which panels and controls are available to block editor users by creating a `settings.json` file in your theme.

## Quick Start

### 1. Copy Example File to Your Theme

```bash
cp wp-content/plugins/Broke-Blocks/block-settings.example.json wp-content/themes/your-theme/settings.json
```

### 2. Choose a Preset

The example file includes three presets:

- **`full`** - All panels enabled (developer mode)
- **`simple`** - Only text and image blocks (perfect for clients)
- **`content-only`** - Blocks and text without advanced features

Edit your `settings.json`:

```json
{
  "activePreset": "simple"
}
```

### 3. Done!

The block editor will now use your settings. No PHP code required.

---

## Presets Explained

### Simple Mode (Recommended for Clients)

Perfect for users who only need to edit text and add images:

**What Users Can Do:**
- Create paragraphs and headings (p, h1-h6)
- Add images with alt text (required)
- Use Rich Text editing
- Select element type from dropdown in toolbar

**What's Hidden:**
- CSS class manager
- Element settings panel
- Raw HTML editing
- Advanced attributes
- Link blocks
- Dynamic/Twig features
- Block conversion tools
- All sidebar panels except Image Settings

**Use Case:** Blog editors, content managers, clients who need minimal page editing without styling controls.

```json
{
  "activePreset": "simple"
}
```

### Content-Only Mode

Allows structured content without raw HTML or dynamic features:

**What Users Can Do:**
- Create container blocks (div, section, article, etc.)
- Add text content
- Create images and links
- Manage classes

**What's Hidden:**
- Raw HTML editing
- Dynamic/Twig features
- Self-closing tag option

**Use Case:** Marketing teams, junior developers, structured content creation.

```json
{
  "activePreset": "content-only"
}
```

### Full Mode (Default)

Everything enabled - for developers and power users:

**What Users Can Do:**
- Everything - no restrictions

**Use Case:** Developers, theme builders, advanced users.

```json
{
  "activePreset": "full"
}
```

---

## Custom Configuration

You can customize any preset or create your own configuration.

### Example: Simple Mode + Links

Start with simple preset but allow link blocks:

```json
{
  "activePreset": "simple",
  "inspectorControls": {
    "linkSettings": {
      "enabled": true
    },
    "elementSettings": {
      "controls": {
        "tagName": {
          "allowedTags": ["p", "h1", "h2", "h3", "h4", "h5", "h6", "img", "a"]
        }
      }
    }
  }
}
```

### Example: Only Specific Tags

Restrict to only divs and paragraphs:

```json
{
  "inspectorControls": {
    "elementSettings": {
      "controls": {
        "tagName": {
          "enabled": true,
          "allowedTags": ["div", "p"]
        }
      }
    }
  }
}
```

### Example: Disable HTML Mode

Allow blocks and text, but not raw HTML:

```json
{
  "inspectorControls": {
    "elementSettings": {
      "controls": {
        "contentType": {
          "enabled": true,
          "allowedTypes": ["blocks", "text"]
        }
      }
    }
  }
}
```

---

## All Available Panels

### Inspector Controls (Sidebar)

**Always Visible Panels:**
- `plainClassesManager` - CSS class management
- `dynamicPreviewToggle` - Dynamic preview toggle

**Core Panel:**
- `elementSettings` - Tag name, content type, conversions

**Conditional Panels** (based on tag):
- `imageSettings` - Image picker and alt text (when tag is `img`)
- `linkSettings` - URL and link options (when tag is `a`)

**Twig/Dynamic Panels:**
- `loopControls` - Iteration over collections
- `conditionalVisibility` - Show/hide based on conditions
- `setVariable` - Variable assignment

### Block Controls (Toolbar)

- `tagNameToolbar` - Tag selector in toolbar
- `dynamicPreviewButton` - Preview toggle button

---

## Panel Controls Reference

### Plain Classes Manager

```json
{
  "plainClassesManager": {
    "enabled": true,
    "controls": {
      "input": { "enabled": true },       // Add new classes
      "removeToken": { "enabled": true }, // Remove individual class
      "clearAll": { "enabled": true }     // Clear all button
    }
  }
}
```

### Element Settings

```json
{
  "elementSettings": {
    "enabled": true,
    "initialOpen": true,
    "controls": {
      "tagName": {
        "enabled": true,
        "allowedTags": []  // Empty = all allowed, or ["div", "p", "h1"]
      },
      "contentType": {
        "enabled": true,
        "allowedTypes": ["blocks", "text", "html", "empty"]
      },
      "textContent": { "enabled": true },
      "selfClosing": { "enabled": true },
      "editAttributes": { "enabled": true },
      "toHtml": { "enabled": true },      // Convert blocks to HTML
      "editHtml": { "enabled": true },    // Open HTML editor
      "toBlocks": { "enabled": true }     // Convert HTML to blocks
    }
  }
}
```

### Image Settings

```json
{
  "imageSettings": {
    "enabled": true,
    "initialOpen": true,
    "controls": {
      "mediaLibraryPicker": { "enabled": true },
      "selectImage": { "enabled": true },
      "preview": { "enabled": true },
      "replaceImage": { "enabled": true },
      "removeImage": { "enabled": true },
      "altText": {
        "enabled": true,
        "required": false  // Set to true to require alt text
      },
      "dimensionsDisplay": { "enabled": true },
      "sourceDisplay": { "enabled": true }
    }
  }
}
```

### Link Settings

```json
{
  "linkSettings": {
    "enabled": true,
    "initialOpen": false,
    "controls": {
      "externalToggle": { "enabled": true },
      "urlInput": { "enabled": true },
      "postTypeSelector": {
        "enabled": true,
        "allowedPostTypes": []  // Empty = all, or ["page", "post"]
      },
      "postPicker": { "enabled": true },
      "urlDisplay": { "enabled": true },
      "newTabToggle": {
        "enabled": true,
        "defaultValue": false
      },
      "relAttribute": { "enabled": true },
      "ariaLabel": { "enabled": true },
      "removeLink": { "enabled": true }
    }
  }
}
```

### Loop Controls

```json
{
  "loopControls": {
    "enabled": true,
    "initialOpen": false,
    "controls": {
      "enableToggle": { "enabled": true },
      "loopSource": { "enabled": true },
      "itemVariable": { "enabled": true },
      "outputPreview": { "enabled": true }
    }
  }
}
```

### Conditional Visibility

```json
{
  "conditionalVisibility": {
    "enabled": true,
    "initialOpen": false,
    "controls": {
      "enableToggle": { "enabled": true },
      "conditionInput": { "enabled": true },
      "outputPreview": { "enabled": true }
    }
  }
}
```

### Set Variable

```json
{
  "setVariable": {
    "enabled": true,
    "initialOpen": false,
    "controls": {
      "enableToggle": { "enabled": true },
      "variableName": { "enabled": true },
      "expression": { "enabled": true },
      "outputPreview": { "enabled": true }
    }
  }
}
```

---

## Settings Priority

Settings are loaded in this order:

1. **Theme** - `{your-theme}/block-settings.json` (highest priority)
2. **Plugin** - `{plugin}/block-settings.example.json` (fallback)
3. **Hardcoded** - All panels enabled (final fallback)

Theme settings always override plugin settings.

---

## Development Tips

### Check Active Settings

In browser console:

```javascript
console.log(window.ubBlockSettings);
```

Output shows:
- `settings` - Full configuration object
- `source` - Where settings came from ('theme', 'plugin', or 'default')
- `allowedTags` - Filtered tag list
- `allowedContentTypes` - Filtered content type list

### Testing Different Configurations

1. Edit `block-settings.json` in your theme
2. Reload the editor (hard refresh: Cmd/Ctrl + Shift + R)
3. Check inspector controls

No PHP changes needed - settings load automatically.

### Common Issues

**Settings not loading:**
- Check JSON syntax (use JSONLint.com)
- Verify file is in active theme directory
- Check browser console for errors
- Hard refresh browser (Cmd/Ctrl + Shift + R)

**Panels still showing:**
- Make sure `"enabled": false` not `"enabled": "false"` (boolean not string)
- Check spelling of panel names (case-sensitive)
- Verify preset name is correct

---

## Real-World Examples

### Example 1: Blog Authors

Only paragraphs, headings, and images:

```json
{
  "activePreset": "simple"
}
```

### Example 2: Landing Page Builder

Allow all container blocks but no Twig:

```json
{
  "inspectorControls": {
    "elementSettings": {
      "controls": {
        "contentType": {
          "allowedTypes": ["blocks", "text", "empty"]
        }
      }
    },
    "loopControls": { "enabled": false },
    "conditionalVisibility": { "enabled": false },
    "setVariable": { "enabled": false }
  }
}
```

### Example 3: Strict Template Mode

Only specific semantic HTML5 tags:

```json
{
  "inspectorControls": {
    "elementSettings": {
      "controls": {
        "tagName": {
          "allowedTags": [
            "header", "nav", "main", "article", "section",
            "aside", "footer", "h1", "h2", "h3", "p", "img"
          ]
        },
        "contentType": {
          "allowedTypes": ["blocks", "text", "empty"]
        },
        "editAttributes": { "enabled": false },
        "toHtml": { "enabled": false },
        "editHtml": { "enabled": false }
      }
    },
    "linkSettings": { "enabled": true },
    "imageSettings": { "enabled": true },
    "loopControls": { "enabled": false },
    "conditionalVisibility": { "enabled": false },
    "setVariable": { "enabled": false }
  }
}
```

---

## Troubleshooting

### Users See Too Many Options

**Solution:** Use `"activePreset": "simple"` or hide specific panels.

### Need to Restrict Specific Attributes

**Solution:** Currently not implemented. Coming in future version.

### Want Different Settings Per User Role

**Solution:** Use PHP filter (advanced):

```php
add_filter('universal_block_settings', function($settings) {
    if (!current_user_can('manage_options')) {
        // Non-admins get simple mode
        return [
            'activePreset' => 'simple'
        ];
    }
    return $settings;
});
```

### Settings Not Taking Effect

1. Clear browser cache
2. Hard refresh (Cmd/Ctrl + Shift + R)
3. Check browser console for errors
4. Verify JSON is valid
5. Make sure file is in active theme root

---

## Support

- **Documentation:** `docs/` directory in plugin
- **Example File:** `block-settings.example.json` in plugin root
- **GitHub Issues:** [Report bugs or request features]

---

## Version History

- **1.0.0** - Initial release with preset system
