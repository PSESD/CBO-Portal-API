/**
 * Created by zaenal on 21/05/15.
 */
function Model(model)
{
    this.model = model;
}
/**
 *
 * @returns {{create: Function, save: Function, get: Function, all: Function, delete: Function}}
 */
Model.prototype.crud = function(){
    var self = this;
    return {
        /**
         *
         * @param req
         * @param res
         */
        create: function(req, res){
            var obj = new self.model(req.body);

            obj.save(function(err) {
                if (err) {
                    return res.send(err);
                }

                res.send({ message: 'Successfully Added' });
            });
        },
        /**
         *
         * @param req
         * @param res
         */
        save: function(req, res){
            self.model.findOne({ _id: req.params.id }, function(err, obj) {
                if (err) {
                    return res.send(err);
                }

                for (prop in req.body) {
                    obj[prop] = req.body[prop];
                }

                // save the movie
                obj.save(function (err) {
                    if (err) {
                        return res.send(err);
                    }

                    res.json({message: 'Successfully updated!'});
                });
            });
        },
        /**
         *
         * @param req
         * @param res
         */
        get: function(req, res){
            self.model.findOne({ _id: req.params.id}, function(err, obj) {
                if (err) {
                    return res.send(err);
                }
                res.json(obj);
            });
        },
        /**
         *
         * @param req
         * @param res
         */
        all: function(req, res){
            console.log("ALL");
            self.model.find(function(err, objs) {
                if (err) {
                    return res.send(err);
                }
                res.json(objs);
            });
        },
        /**
         *
         * @param req
         * @param res
         */
        delete: function(req, res){
            self.model.remove({
                _id: req.params.id
            }, function(err, obj) {
                if (err) {
                    return res.send(err);
                }

                res.json({ message: 'Successfully deleted' });
            });
        }
    }
};

module.exports = Model;