export class Login {
    username: string;
    token: string;
    access: string;
    succeeded: boolean;

    constructor(_username: string, _token: string) {
        this.username = _username;
        this.token = _token;
        this.access = '';
        this.succeeded = false;
    }

    isAdmin(): boolean {
        return 'admin' === this.access;
    }

    clear() {
        this.username = '';
        this.token = '';
        this.succeeded = false;
    }

    getUsername() {
        return this.username;
    }

    getToken() {
        return this.token;
    }


    // toJSON() {
    //     // {"login":"eu","pwd":"12345"}
    //     return { login: this.username, pwd: this.passwordHash };
    //     // return `{"login":"` + this.username + `","pwd":"` + this.passwordHash + `"}`;
    // }

}
