/*global jQuery*/

var setupPhotos = (function ($) {
    function each (items, callback) {
        var i;
        for (i = 0; i < items.length; i += 1) {
            setTimeout(callback.bind(this, items[i]), 0);
        }
    }

    function flatten (items) {
        return items.reduce(function (a, b) {
            return a.concat(b);
        });
    }

    function loadPhotosByTag (tag, max, callback) {
        var photos = [];
        var callback_name = 'callback_' + Math.floor(Math.random() * 100000);

        window[callback_name] = function (data) {
            delete window[callback_name];
            var i;
            for (i = 0; i < max; i += 1) {
                photos.push(data.items[i].media.m);
            }
            callback(null, photos);
        };

        $.ajax({
            url: 'http://api.flickr.com/services/feeds/photos_public.gne',
            data: {
                tags: tag,
                lang: 'en-us',
                format: 'json',
                jsoncallback: callback_name
            },
            dataType: 'jsonp'
        });
    }

    function loadAllPhotos (tags, max, callback) {
        var results = [];
        function handleResult (err, photos) {
            if (err) { return callback(err); }

            results.push(photos);
            if (results.length === tags.length) {
                callback(null, flatten(results));
            }
        }

        each(tags, function (tag) {
            loadPhotosByTag(tag, max, handleResult);
        });
    }

    function renderPhoto (photo) {
        var img = new Image();
        img.src = photo;
        return img;
    }

    function imageAppender (id) {
        var holder = document.getElementById(id);
        return function (img) {
            var elm = document.createElement('div');
            elm.className = 'photo';
			//add fave
			elm.appendChild(addFavButton(img.src));
            elm.appendChild(img);
            holder.appendChild(elm);
        };
    }
	
	function addFavButton(img) {
		var el = document.createElement('i'); //this is our favourite button
		el.className = isFav(img) ? 'icon-heart' : 'icon-heart-empty'; // is it our favourite?
		el.onclick = function() {
			img = this.parentNode.childNodes[1]; // we are looking for img that is in the same container( the same parent)
			updateFav(img.src);
			updateState(img, this);
		};
		// mouseover and mouseout are not required, just looks better :)
		el.onmouseover = function() { 
			if (this.className == 'icon-heart') {
				this.className = 'icon-heart-empty';
			}
			else if (this.className == 'icon-heart-empty') {
				this.className = 'icon-heart';
			}
		};
		el.onmouseout = function() {
			img = this.parentNode.childNodes[1];
			updateState(img, this); // be sure to update to good state
		};
		return el;
	}
	
	function updateFav(img) {
		//we just need img src to add it into cookie
		//state is choosen here, it reverses actual state and update cookie
		if (isFav(img)) {
			val = isFav();
			for (i in val) {
				if (val[i] == img) {
					delete val[i];
				}
			}
		}
		else {
			val = isFav();
			val[val.length] = img;
		}
		
		document.cookie = 'fav='+escape(val.join())+";";
	}
	
	function isFav(img) {
		//if our cookie not exists, add empty
		if (!document.cookie.length || document.cookie.indexOf('fav') == -1) {
			document.cookie = "fav=;";
		}
		//we know how we named cookie, so just find that one
		value = document.cookie.split('fav')[1].split(';')[0].split('=')[1];
		values = unescape(value).split(',');
		
		//this could be helpful, somewhere, but not now
		if (img == null) {
			return values;
		}
		else {
			//true, if img is favourite
			for (i in values) {
				if (values[i] == img) {
					return true;
				}
			}
		}
		return false;
	}
	
	//this one just updates class of fav button
	function updateState(img, el) {
		if (isFav(img.src)) {
			el.className = 'icon-heart';
		}
		else {
			el.className = 'icon-heart-empty';
		}
	}

    // ----
    
    var max_per_tag = 5;
    return function setup (tags, callback) {
        loadAllPhotos(tags, max_per_tag, function (err, items) {
            if (err) { return callback(err); }

            each(items.map(renderPhoto), imageAppender('photos'));
            callback();
        });
    };
}(jQuery));
